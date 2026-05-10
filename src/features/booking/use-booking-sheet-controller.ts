import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import { createBookingDiagnosticsReporter } from './booking-diagnostics'
import type { BookingSession } from './booking-service'
import { useBookingFlow } from './use-booking-flow'

const SUCCESS_DISMISS_DELAY_MS = 1250

export type BookingSheetState =
  | {
      status: 'closed'
    }
  | {
      selection: BookingSlotSelection
      status: 'confirm'
    }
  | {
      selection: BookingSlotSelection
      status: 'submitting'
    }
  | {
      result: BookingFlowResult
      selection: BookingSlotSelection
      status: 'completed'
      traceId: string
    }

type InternalBookingSheetState =
  | {
      status: 'closed'
    }
  | {
      selection: BookingSlotSelection
      status: 'confirm'
    }
  | {
      selection: BookingSlotSelection
      status: 'submitting'
    }
  | {
      result: BookingFlowResult
      session: BookingSession
      selection: BookingSlotSelection
      status: 'completed'
    }

type UseBookingSheetControllerOptions = {
  onDismissCompleted?: {
    effect: 'refresh_availability'
    run(): void | Promise<void>
  }
  successDismissDelayMs?: number | undefined
}

export function useBookingSheetController({
  onDismissCompleted,
  successDismissDelayMs = SUCCESS_DISMISS_DELAY_MS,
}: UseBookingSheetControllerOptions = {}) {
  const { isBookingReady, submitBooking } = useBookingFlow()
  const [internalBookingSheetState, setInternalBookingSheetState] =
    useState<InternalBookingSheetState>({ status: 'closed' })
  // Render state remains the source of truth for UI. This ref only exists for
  // synchronous confirm/dismiss guards in the gap before React applies the
  // queued 'submitting' render state.
  const submitInFlightRef = useRef(false)
  const isMountedRef = useRef(true)
  // Keep the latest completed session available for dismiss/unmount cleanup.
  const currentCompletedSessionRef = useRef<BookingSession | null>(null)

  const runDismissSideEffect = useCallback(
    async (session: BookingSession) => {
      await session.releaseReservation()

      if (!isMountedRef.current || onDismissCompleted === undefined) {
        return
      }

      await Promise.resolve(onDismissCompleted.run()).catch(() => {
        if (!isMountedRef.current) {
          return
        }

        const diagnosticsReporter = createBookingDiagnosticsReporter(
          session.trace,
        )

        diagnosticsReporter.recordSheetDismissSideEffectFailed({
          bookingTraceId: session.trace.traceId,
          effect: onDismissCompleted.effect,
        })
      })
    },
    [onDismissCompleted],
  )

  const dismissBookingSheet = useCallback(() => {
    if (submitInFlightRef.current) {
      return
    }

    const completedSession = currentCompletedSessionRef.current
    currentCompletedSessionRef.current = null

    setInternalBookingSheetState({ status: 'closed' })

    if (completedSession === null) {
      return
    }

    void runDismissSideEffect(completedSession)
  }, [runDismissSideEffect])

  const requestBooking = useCallback((selection: BookingSlotSelection) => {
    setInternalBookingSheetState((currentState) => {
      if (currentState.status === 'submitting') {
        return currentState
      }

      return {
        selection,
        status: 'confirm',
      }
    })
  }, [])

  const confirmBooking = useCallback(async (): Promise<void> => {
    if (
      internalBookingSheetState.status !== 'confirm' ||
      submitInFlightRef.current
    ) {
      return
    }

    const { selection } = internalBookingSheetState

    submitInFlightRef.current = true
    setInternalBookingSheetState({
      selection,
      status: 'submitting',
    })

    try {
      const submission = await submitBooking(selection)

      if (!isMountedRef.current) {
        await submission.releaseReservation()
        return
      }

      setInternalBookingSheetState({
        result: submission.result,
        session: submission,
        selection,
        status: 'completed',
      })
    } finally {
      submitInFlightRef.current = false
    }
  }, [internalBookingSheetState, submitBooking])

  useEffect(() => {
    currentCompletedSessionRef.current =
      internalBookingSheetState.status === 'completed'
        ? internalBookingSheetState.session
        : null
  }, [internalBookingSheetState])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      const completedSession = currentCompletedSessionRef.current

      if (completedSession === null) {
        return
      }

      void completedSession.releaseReservation()
    }
  }, [])

  const bookingSheetState = toBookingSheetState(internalBookingSheetState)

  useEffect(() => {
    if (
      internalBookingSheetState.status !== 'completed' ||
      internalBookingSheetState.result.status !== 'success'
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      dismissBookingSheet()
    }, successDismissDelayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [internalBookingSheetState, dismissBookingSheet, successDismissDelayMs])

  return {
    bookingSheetState,
    confirmBooking,
    dismissBookingSheet,
    isBookingInProgress: internalBookingSheetState.status === 'submitting',
    isBookingReady,
    requestBooking,
  }
}

function toBookingSheetState(
  state: InternalBookingSheetState,
): BookingSheetState {
  if (state.status !== 'completed') {
    return state
  }

  return {
    result: state.result,
    selection: state.selection,
    status: 'completed',
    traceId: state.session.trace.traceId,
  }
}

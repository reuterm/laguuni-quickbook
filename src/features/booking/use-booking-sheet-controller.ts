import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { BookingFlowSubmission } from './use-booking-flow'
import { useBookingFlow } from './use-booking-flow'

const SUCCESS_DISMISS_DELAY_MS = 5000

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

type UseBookingSheetControllerOptions = {
  successDismissDelayMs?: number
  onBookingFinalized?:
    | ((finalizedBooking: {
        result: BookingFlowResult
        selection: BookingSlotSelection
      }) => void | Promise<void>)
    | undefined
}

export function useBookingSheetController({
  onBookingFinalized,
  successDismissDelayMs = SUCCESS_DISMISS_DELAY_MS,
}: UseBookingSheetControllerOptions = {}) {
  const { isBookingReady, submitBooking } = useBookingFlow()
  const [bookingSheetState, setBookingSheetState] = useState<BookingSheetState>(
    { status: 'closed' },
  )
  const submitInFlightRef = useRef(false)
  const completedSubmissionRef = useRef<BookingFlowSubmission | null>(null)

  const takeCompletedSubmission = useCallback(() => {
    const completedSubmission = completedSubmissionRef.current
    completedSubmissionRef.current = null

    return completedSubmission
  }, [])

  const finalizeCompletedSubmission = useCallback(
    async (submission: BookingFlowSubmission): Promise<void> => {
      if (submission.result.status !== 'success') {
        await submission.releaseReservation()
      }

      await onBookingFinalized?.({
        result: submission.result,
        selection: submission.selection,
      })
    },
    [onBookingFinalized],
  )

  const finalizeDismissedSubmission = useCallback(
    async (submission: BookingFlowSubmission): Promise<void> => {
      try {
        await finalizeCompletedSubmission(submission)
      } catch {
        // Dismissal finalization is best-effort. The sheet is already closed,
        // so ignore failures from reservation cleanup and follow-up work such
        // as refreshing availability.
      }
    },
    [finalizeCompletedSubmission],
  )

  const dismissBookingSheet = useCallback(() => {
    if (submitInFlightRef.current) {
      return
    }

    const completedSubmission = takeCompletedSubmission()

    setBookingSheetState({ status: 'closed' })

    if (
      completedSubmission === null ||
      completedSubmission.result.status === 'success'
    ) {
      return
    }

    void finalizeDismissedSubmission(completedSubmission)
  }, [finalizeDismissedSubmission, takeCompletedSubmission])

  const releaseAbandonedCompletedSubmission = useCallback(() => {
    const completedSubmission = takeCompletedSubmission()

    if (
      completedSubmission === null ||
      completedSubmission.result.status === 'success'
    ) {
      return
    }

    void completedSubmission.releaseReservation()
  }, [takeCompletedSubmission])

  const requestBooking = useCallback((selection: BookingSlotSelection) => {
    setBookingSheetState((currentState) => {
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
    if (bookingSheetState.status !== 'confirm' || submitInFlightRef.current) {
      return
    }

    const { selection } = bookingSheetState

    submitInFlightRef.current = true
    setBookingSheetState({
      selection,
      status: 'submitting',
    })

    try {
      const submission = await submitBooking(selection)
      completedSubmissionRef.current = submission

      setBookingSheetState({
        result: submission.result,
        selection,
        status: 'completed',
        traceId: submission.traceId,
      })

      if (submission.result.status === 'success') {
        await finalizeCompletedSubmission(submission)
      }
    } finally {
      submitInFlightRef.current = false
    }
  }, [bookingSheetState, finalizeCompletedSubmission, submitBooking])

  useEffect(() => {
    return () => {
      releaseAbandonedCompletedSubmission()
    }
  }, [releaseAbandonedCompletedSubmission])

  useEffect(() => {
    if (
      bookingSheetState.status !== 'completed' ||
      bookingSheetState.result.status !== 'success'
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      dismissBookingSheet()
    }, successDismissDelayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [bookingSheetState, dismissBookingSheet, successDismissDelayMs])

  return {
    bookingSheetState,
    confirmBooking,
    dismissBookingSheet,
    isBookingInProgress: bookingSheetState.status === 'submitting',
    isBookingReady,
    requestBooking,
  }
}

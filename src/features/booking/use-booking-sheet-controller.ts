import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { BookingFlowSubmission } from './use-booking-flow'
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

type UseBookingSheetControllerOptions = {
  successDismissDelayMs?: number
  onBookingCompleted?:
    | ((result: BookingFlowResult) => void | Promise<void>)
    | undefined
}

export function useBookingSheetController({
  onBookingCompleted,
  successDismissDelayMs = SUCCESS_DISMISS_DELAY_MS,
}: UseBookingSheetControllerOptions = {}) {
  const { isBookingReady, submitBooking } = useBookingFlow()
  const [bookingSheetState, setBookingSheetState] = useState<BookingSheetState>(
    { status: 'closed' },
  )
  const submitInFlightRef = useRef(false)
  const completedSubmissionRef = useRef<BookingFlowSubmission | null>(null)

  const dismissBookingSheet = useCallback(() => {
    if (submitInFlightRef.current) {
      return
    }

    const completedSubmission = completedSubmissionRef.current
    completedSubmissionRef.current = null

    setBookingSheetState({ status: 'closed' })

    if (
      completedSubmission === null ||
      completedSubmission.result.status === 'success'
    ) {
      return
    }

    void completedSubmission.releaseReservation().then(() => {
      void onBookingCompleted?.(completedSubmission.result)
    })
  }, [onBookingCompleted])

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
        await onBookingCompleted?.(submission.result)
      }
    } finally {
      submitInFlightRef.current = false
    }
  }, [bookingSheetState, onBookingCompleted, submitBooking])

  useEffect(() => {
    return () => {
      const completedSubmission = completedSubmissionRef.current

      if (
        completedSubmission === null ||
        completedSubmission.result.status === 'success'
      ) {
        return
      }

      void completedSubmission.releaseReservation()
    }
  }, [])

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

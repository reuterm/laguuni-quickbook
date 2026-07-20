import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
import type { BookingFlowSubmission } from './use-booking-flow'
import { useBookingFlow } from './use-booking-flow'

export type BookingSheetState =
  | {
      status: 'closed'
    }
  | {
      selections: readonly [BookingSlotSelection, ...BookingSlotSelection[]]
      status: 'confirm'
    }
  | {
      selections: readonly [BookingSlotSelection, ...BookingSlotSelection[]]
      status: 'submitting'
    }
  | {
      result: BookingFlowResult
      selections: readonly [BookingSlotSelection, ...BookingSlotSelection[]]
      status: 'completed'
      traceId: string
    }

type UseBookingSheetControllerOptions = {
  onBookingFinalized?:
    | ((finalizedBooking: {
        result: BookingFlowResult
        selections: readonly BookingSlotSelection[]
      }) => void | Promise<void>)
    | undefined
}

export function useBookingSheetController({
  onBookingFinalized,
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
        selections: submission.selections,
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
        selections: [selection],
        status: 'confirm',
      }
    })
  }, [])

  const confirmBooking = useCallback(async (): Promise<void> => {
    if (bookingSheetState.status !== 'confirm' || submitInFlightRef.current) {
      return
    }

    const { selections } = bookingSheetState

    submitInFlightRef.current = true
    setBookingSheetState({
      selections,
      status: 'submitting',
    })

    try {
      const submission = await submitBooking(selections)
      completedSubmissionRef.current = submission

      setBookingSheetState({
        result: submission.result,
        selections,
        status: 'completed',
        traceId: submission.traceId,
      })

      if (submission.result.status === 'success') {
        submitInFlightRef.current = false
        try {
          await finalizeCompletedSubmission(submission)
        } catch {
          // Successful bookings must stay successful even if follow-up work such
          // as availability refresh fails after the result is already visible.
        }
        return
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

  return {
    bookingSheetState,
    confirmBooking,
    dismissBookingSheet,
    isBookingInProgress: bookingSheetState.status === 'submitting',
    isBookingReady,
    requestBooking,
  }
}

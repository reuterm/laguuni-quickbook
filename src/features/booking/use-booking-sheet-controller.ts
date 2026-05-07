import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../domain/booking'
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
  onBookingSubmitted?: (() => void | Promise<void>) | undefined
}

export function useBookingSheetController({
  onBookingSubmitted,
  successDismissDelayMs = SUCCESS_DISMISS_DELAY_MS,
}: UseBookingSheetControllerOptions = {}) {
  const { isBookingReady, submitBooking } = useBookingFlow()
  const [bookingSheetState, setBookingSheetState] = useState<BookingSheetState>(
    { status: 'closed' },
  )
  const submitInFlightRef = useRef(false)

  const dismissBookingSheet = useCallback(() => {
    setBookingSheetState((currentState) => {
      if (currentState.status === 'submitting') {
        return currentState
      }

      return { status: 'closed' }
    })
  }, [])

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

      setBookingSheetState({
        result: submission.result,
        selection,
        status: 'completed',
        traceId: submission.traceId,
      })

      if (submission.result.status !== 'failed') {
        await onBookingSubmitted?.()
      }
    } finally {
      submitInFlightRef.current = false
    }
  }, [bookingSheetState, onBookingSubmitted, submitBooking])

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

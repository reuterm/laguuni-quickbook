import { type ReactNode, useEffect, useRef, useState } from 'react'

import { getBookingSelectionPresentation } from '../booking-selection-label'
import type { BookingSheetState } from '../use-booking-sheet-controller'
import { BookingConfirmPanel } from './BookingConfirmPanel'
import { BookingResultPanel } from './BookingResultPanel'
import { BookingSheet } from './BookingSheet'
import { BookingSubmittingPanel } from './BookingSubmittingPanel'

type BookingSheetFlowProps = {
  bookingSheetState: BookingSheetState
  confirmBooking: () => Promise<void>
  dismissBookingSheet: () => void
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
}

export const BOOKING_SHEET_EXIT_DURATION_MS = 250

export function BookingSheetFlow({
  bookingSheetState,
  confirmBooking,
  dismissBookingSheet,
  onExportTrace,
}: BookingSheetFlowProps) {
  const [renderedState, setRenderedState] = useState<BookingSheetState>(
    bookingSheetState,
  )
  const renderedStateRef = useRef(renderedState)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    renderedStateRef.current = renderedState
  }, [renderedState])

  useEffect(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (bookingSheetState.status !== 'closed') {
      setRenderedState(bookingSheetState)
      return
    }

    if (renderedStateRef.current.status === 'closed') {
      return
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setRenderedState({ status: 'closed' })
      closeTimeoutRef.current = null
    }, BOOKING_SHEET_EXIT_DURATION_MS)
  }, [bookingSheetState])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [])

  if (renderedState.status === 'closed') {
    return null
  }

  const selectionSummary = getBookingSelectionPresentation(
    renderedState.selection,
  )

  let dismissible = true
  let content: ReactNode

  switch (renderedState.status) {
    case 'confirm':
      content = <BookingConfirmPanel onConfirm={confirmBooking} />
      break
    case 'submitting':
      dismissible = false
      content = (
        <BookingSubmittingPanel selectionLabel={selectionSummary.label} />
      )
      break
    case 'completed':
      content = (
        <BookingResultPanel
          onExportTrace={onExportTrace}
          result={renderedState.result}
          selectionLabel={selectionSummary.label}
          traceId={renderedState.traceId}
        />
      )
      break
  }

  return (
    <BookingSheet
      dismissible={dismissible}
      onDismiss={dismissBookingSheet}
      open={bookingSheetState.status !== 'closed'}
      summary={selectionSummary}
    >
      {content}
    </BookingSheet>
  )
}

import type { ReactNode } from 'react'

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

export function BookingSheetFlow({
  bookingSheetState,
  confirmBooking,
  dismissBookingSheet,
  onExportTrace,
}: BookingSheetFlowProps) {
  if (bookingSheetState.status === 'closed') {
    return null
  }

  const selectionSummary = getBookingSelectionPresentation(
    bookingSheetState.selection,
  )

  let dismissible = true
  let content: ReactNode

  switch (bookingSheetState.status) {
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
          result={bookingSheetState.result}
          selectionLabel={selectionSummary.label}
          traceId={bookingSheetState.traceId}
        />
      )
      break
  }

  return (
    <BookingSheet
      dismissible={dismissible}
      onDismiss={dismissBookingSheet}
      summary={selectionSummary}
    >
      {content}
    </BookingSheet>
  )
}

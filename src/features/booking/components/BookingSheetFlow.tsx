import { type ReactNode, useRef } from 'react'

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
  const renderedStateRef = useRef<Exclude<
    BookingSheetState,
    { status: 'closed' }
  > | null>(bookingSheetState.status === 'closed' ? null : bookingSheetState)
  const open = bookingSheetState.status !== 'closed'

  if (open) {
    renderedStateRef.current = bookingSheetState
  }

  const renderedState = renderedStateRef.current

  if (renderedState === null) {
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
      open={open}
      summary={selectionSummary}
    >
      {content}
    </BookingSheet>
  )
}

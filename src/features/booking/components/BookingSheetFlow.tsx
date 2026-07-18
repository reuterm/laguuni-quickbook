import { type ReactNode, useRef } from 'react'
import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../../domain/booking'
import { useBookingCalendarAction } from '../../calendar/use-booking-calendar-action'
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
  onExportTrace: (traceId: string) => Promise<void>
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
        <CompletedBookingResultPanel
          onExportTrace={onExportTrace}
          result={renderedState.result}
          selection={renderedState.selection}
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

type CompletedBookingResultPanelProps = {
  onExportTrace: (traceId: string) => Promise<void>
  result: BookingFlowResult
  selection: BookingSlotSelection
  selectionLabel: string
  traceId: string
}

function CompletedBookingResultPanel({
  onExportTrace,
  result,
  selection,
  selectionLabel,
  traceId,
}: CompletedBookingResultPanelProps) {
  const bookingCalendarAction = useBookingCalendarAction(
    selection,
    result.status === 'success' ? (result.orderIdentifier ?? traceId) : traceId,
  )

  return (
    <BookingResultPanel
      calendarErrorMessage={bookingCalendarAction.errorMessage}
      onAddToCalendar={bookingCalendarAction.addToCalendar}
      onExportTrace={onExportTrace}
      result={result}
      selectionLabel={selectionLabel}
      traceId={traceId}
    />
  )
}

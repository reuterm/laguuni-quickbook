import { type ReactNode, useRef } from 'react'
import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../../domain/booking'
import { useBookingCalendarAction } from '../../calendar/use-booking-calendar-action'
import { getBookingSelectionsPresentation } from '../booking-selections'
import type { BookingSheetState } from '../use-booking-sheet-controller'
import { BookingConfirmPanel } from './BookingConfirmPanel'
import { BookingResultPanel } from './BookingResultPanel'
import { BookingSheet } from './BookingSheet'
import { BookingSubmittingPanel } from './BookingSubmittingPanel'

type BookingSheetFlowProps = {
  bookingSheetState: BookingSheetState
  confirmBooking: () => Promise<void>
  dismissBookingSheet: () => void
  keepBookingForMore?: () => void
  onExportTrace: (traceId: string) => Promise<void>
}

export function BookingSheetFlow({
  bookingSheetState,
  confirmBooking,
  dismissBookingSheet,
  keepBookingForMore,
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

  const selectionSummary = getBookingSelectionsPresentation(
    renderedState.selections,
  )

  let dismissible = true
  let content: ReactNode

  switch (renderedState.status) {
    case 'confirm':
      content = (
        <BookingConfirmPanel
          {...(renderedState.kind === 'initial' &&
          keepBookingForMore !== undefined
            ? { onAddMore: keepBookingForMore }
            : {})}
          onConfirm={confirmBooking}
        />
      )
      break
    case 'submitting':
      dismissible = false
      content = (
        <BookingSubmittingPanel
          selectionsCount={renderedState.selections.length}
        />
      )
      break
    case 'completed':
      content = (
        <CompletedBookingResultPanel
          onExportTrace={onExportTrace}
          result={renderedState.result}
          selections={renderedState.selections}
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
  selections: readonly BookingSlotSelection[]
  selectionLabel: string
  traceId: string
}

function CompletedBookingResultPanel({
  onExportTrace,
  result,
  selections,
  selectionLabel,
  traceId,
}: CompletedBookingResultPanelProps) {
  const bookingCalendarAction = useBookingCalendarAction(
    selections,
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

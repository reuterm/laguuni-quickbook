import { type ReactNode, useRef } from 'react'

import { useBookingCalendarAction } from '../../calendar/use-booking-calendar-action'
import type { BookingFlowResult, BookingSlotSelection } from '../../../domain/booking'
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
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
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
  if (result.status !== 'success') {
    return (
      <BookingResultPanel
        onExportTrace={onExportTrace}
        result={result}
        selectionLabel={selectionLabel}
        traceId={traceId}
      />
    )
  }

  return (
    <CompletedSuccessfulBookingResultPanel
      onExportTrace={onExportTrace}
      result={result}
      selection={selection}
      selectionLabel={selectionLabel}
      traceId={traceId}
    />
  )
}

type CompletedSuccessfulBookingResultPanelProps = {
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  result: Extract<BookingFlowResult, { status: 'success' }>
  selection: BookingSlotSelection
  selectionLabel: string
  traceId: string
}

function CompletedSuccessfulBookingResultPanel({
  onExportTrace,
  result,
  selection,
  selectionLabel,
  traceId,
}: CompletedSuccessfulBookingResultPanelProps) {
  const bookingCalendarAction = useBookingCalendarAction(selection)

  return (
    <BookingResultPanel
      onAddToCalendar={bookingCalendarAction.addToCalendar}
      onExportTrace={onExportTrace}
      result={result}
      selectionLabel={selectionLabel}
      showAddToCalendar={bookingCalendarAction.isEnabled}
      traceId={traceId}
    />
  )
}

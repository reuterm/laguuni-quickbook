import { BookingStatusCard } from '../../booking/components/BookingStatusCard'
import type { BookingFlowState } from '../../booking/use-booking-flow'

type AvailabilityBookingStatusProps = {
  bookingState: BookingFlowState
  onDismiss?: (() => void) | undefined
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
}

export function AvailabilityBookingStatus({
  bookingState,
  onDismiss,
  onExportTrace,
}: AvailabilityBookingStatusProps) {
  if (bookingState.status === 'idle') {
    return null
  }

  if (bookingState.status === 'submitting') {
    return (
      <BookingStatusCard
        attemptKey={bookingState.traceId}
        selection={bookingState.selection}
        status="submitting"
      />
    )
  }

  return (
    <BookingStatusCard
      attemptKey={bookingState.traceId}
      onDismiss={onDismiss}
      result={bookingState.result}
      selection={bookingState.selection}
      status="completed"
      traceExport={
        bookingState.result.status === 'failed' && onExportTrace !== undefined
          ? () => onExportTrace(bookingState.traceId)
          : undefined
      }
    />
  )
}

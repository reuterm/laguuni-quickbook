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
        selection={bookingState.selection}
        status="submitting"
        traceId={bookingState.traceId}
      />
    )
  }

  return (
    <BookingStatusCard
      onDismiss={
        bookingState.result.status === 'failed' ? onDismiss : undefined
      }
      result={bookingState.result}
      selection={bookingState.selection}
      status="completed"
      traceExport={
        bookingState.result.status === 'failed' && onExportTrace !== undefined
          ? () => onExportTrace(bookingState.traceId)
          : undefined
      }
      traceId={bookingState.traceId}
    />
  )
}

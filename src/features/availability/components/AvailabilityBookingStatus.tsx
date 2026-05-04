import { BookingStatusCard } from '../../booking/components/BookingStatusCard'
import type { BookingFlowState } from '../../booking/use-booking-flow'

type AvailabilityBookingStatusProps = {
  bookingState: BookingFlowState
  onDismiss?: (() => void) | undefined
  traceId: string
}

export function AvailabilityBookingStatus({
  bookingState,
  onDismiss,
  traceId,
}: AvailabilityBookingStatusProps) {
  if (bookingState.status === 'idle') {
    return null
  }

  if (bookingState.status === 'submitting') {
    return (
      <BookingStatusCard
        selection={bookingState.selection}
        status="submitting"
        traceId={traceId}
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
      traceId={traceId}
    />
  )
}

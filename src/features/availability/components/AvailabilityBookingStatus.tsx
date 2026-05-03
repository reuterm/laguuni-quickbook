import { BookingStatusCard } from '../../booking/components/BookingStatusCard'
import type { BookingFlowState } from '../../booking/use-booking-flow'

type AvailabilityBookingStatusProps = {
  bookingState: BookingFlowState
  traceId: string
}

export function AvailabilityBookingStatus({
  bookingState,
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
      result={bookingState.result}
      selection={bookingState.selection}
      status="completed"
      traceId={traceId}
    />
  )
}

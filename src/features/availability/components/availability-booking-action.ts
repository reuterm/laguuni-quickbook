import type { BookingSlotSelection } from '../../../domain/booking'

type AvailabilityBookingActionProps =
  | {
      bookingActionMode: 'disabled' | 'enabled'
      onBookSelection: (selection: BookingSlotSelection) => void
    }
  | {
      bookingActionMode: 'hidden'
      onBookSelection?: undefined
    }

function getAvailabilityBookingActionProps(
  isBookingReady: boolean,
  isBookingInProgress: boolean,
  onBookSelection: (selection: BookingSlotSelection) => void,
): AvailabilityBookingActionProps {
  if (!isBookingReady) {
    return { bookingActionMode: 'hidden' }
  }

  if (isBookingInProgress) {
    return {
      bookingActionMode: 'disabled',
      onBookSelection,
    }
  }

  return {
    bookingActionMode: 'enabled',
    onBookSelection,
  }
}

export type { AvailabilityBookingActionProps }
export { getAvailabilityBookingActionProps }

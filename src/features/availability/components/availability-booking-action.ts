import type { BookingSlotSelection } from '../../../domain/booking'

type AvailabilityBookingActionProps =
  | {
      bookingActionMode: 'enabled'
      onBookSelection: (selection: BookingSlotSelection) => void
    }
  | {
      bookingActionMode: 'disabled' | 'hidden'
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
    return { bookingActionMode: 'disabled' }
  }

  return {
    bookingActionMode: 'enabled',
    onBookSelection,
  }
}

export type { AvailabilityBookingActionProps }
export { getAvailabilityBookingActionProps }

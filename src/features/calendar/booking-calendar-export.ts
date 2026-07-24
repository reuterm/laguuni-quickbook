import type { BookingSlotSelection } from '../../domain/booking'
import { downloadCalendarFile } from './calendar-download'
import { createBookingCalendarEvent } from './calendar-event'
import { createBookingCalendarFile } from './ical'

export async function exportBookingCalendar(
  selections: readonly BookingSlotSelection[],
  bookingIdentifier: string,
) {
  const events = selections.map((selection) =>
    createBookingCalendarEvent(selection, bookingIdentifier),
  )
  const file = createBookingCalendarFile(
    events,
    `laguuni-booking-${bookingIdentifier}.ics`,
  )

  return downloadCalendarFile(file)
}

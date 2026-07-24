import type { BookingSlotSelection } from '../../domain/booking'
import { createBookingCalendarEvent } from './calendar-event'
import { shareOrDownloadCalendarFile } from './calendar-share'
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

  return shareOrDownloadCalendarFile(file, {
    text: 'Add bookings to your calendar.',
    title: 'Add to calendar',
  })
}

import type { BookingSlotSelection } from '../../domain/booking'
import { createBookingCalendarEvent } from './calendar-event'
import {
  type CalendarShareObserver,
  observeCalendarShare,
  shareOrDownloadCalendarFile,
} from './calendar-share'
import { createBookingCalendarFile } from './ical'

export async function exportBookingCalendar(
  selections: readonly BookingSlotSelection[],
  bookingIdentifier: string,
  observer?: CalendarShareObserver,
) {
  const events = selections.map((selection) =>
    createBookingCalendarEvent(selection, bookingIdentifier),
  )
  const file = createBookingCalendarFile(
    events,
    `laguuni-booking-${bookingIdentifier}.ics`,
  )

  observeCalendarShare(observer, {
    type: 'calendar-export-prepared',
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    selectionCount: selections.length,
  })

  return shareOrDownloadCalendarFile(file, {
    text: 'Add bookings to your calendar.',
    title: 'Add to calendar',
  }, observer)
}

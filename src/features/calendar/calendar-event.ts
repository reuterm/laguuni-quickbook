import type { BookingSlotSelection } from '../../domain/booking'
import { getCableById } from '../../domain/cable'

export type BookingCalendarEvent = {
  description: string
  endsAtLocal: string
  fileName: string
  location: string
  stampUtc: string
  startsAtLocal: string
  timeZone: 'Europe/Helsinki'
  title: string
  uid: string
}

const HELSINKI_TIME_ZONE = 'Europe/Helsinki'

export function createBookingCalendarEvent(
  selection: BookingSlotSelection,
  bookingIdentifier: string,
): BookingCalendarEvent {
  const cable = getCableById(selection.cableId)
  const startsAtLocal = toCalendarDateTime(selection.date, selection.startTime)
  const endsAtLocal = toCalendarDateTime(selection.date, selection.endTime)

  return {
    description: `Wakeboarding booking for ${cable.label} on ${selection.date} at ${selection.startTime}-${selection.endTime}.`,
    endsAtLocal,
    fileName: `laguuni-booking-${selection.date}-${selection.startTime.replace(':', '')}.ics`,
    location: 'Laguuni',
    stampUtc: toUtcStamp(new Date()),
    startsAtLocal,
    timeZone: HELSINKI_TIME_ZONE,
    title: `Wakeboarding - ${cable.label}`,
    uid: `laguuni-booking-${bookingIdentifier}`,
  }
}

function toCalendarDateTime(date: string, time: string): string {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function toUtcStamp(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

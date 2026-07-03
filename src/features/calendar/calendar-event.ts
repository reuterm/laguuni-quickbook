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
): BookingCalendarEvent {
  const cable = getCableById(selection.cableId)
  const startsAtLocal = toCalendarDateTime(selection.date, selection.startTime)
  const endsAtLocal = toCalendarDateTime(selection.date, selection.endTime)

  return {
    description: `Wakeboarding booking for ${cable.label} on ${selection.date} at ${selection.startTime}-${selection.endTime}.`,
    endsAtLocal,
    fileName: `laguuni-booking-${selection.date}-${selection.startTime.replace(':', '')}.ics`,
    location: 'Laguuni',
    stampUtc: toUtcStamp(selection.date, selection.startTime),
    startsAtLocal,
    timeZone: HELSINKI_TIME_ZONE,
    title: `Wakeboarding - ${cable.label}`,
    uid: `laguuni-booking-${selection.date}-${selection.startTime.replace(':', '')}-${selection.cableId}`,
  }
}

function toCalendarDateTime(date: string, time: string): string {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function toUtcStamp(date: string, time: string): string {
  const [inputYear, inputMonth, inputDay] = date.split('-').map(Number)
  const [inputHours, inputMinutes] = time.split(':').map(Number)

  if (
    inputYear === undefined ||
    inputMonth === undefined ||
    inputDay === undefined ||
    inputHours === undefined ||
    inputMinutes === undefined
  ) {
    throw new Error(`Invalid booking date/time: ${date} ${time}`)
  }

  const localTimestamp = Date.UTC(
    inputYear,
    inputMonth - 1,
    inputDay,
    inputHours,
    inputMinutes,
    0,
  )
  const offsetMinutes = getTimeZoneOffsetMinutes(
    new Date(localTimestamp),
    HELSINKI_TIME_ZONE,
  )
  const helsinkiDateTime = new Date(localTimestamp - offsetMinutes * 60_000)

  const year = helsinkiDateTime.getUTCFullYear()
  const month = String(helsinkiDateTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(helsinkiDateTime.getUTCDate()).padStart(2, '0')
  const hours = String(helsinkiDateTime.getUTCHours()).padStart(2, '0')
  const minutes = String(helsinkiDateTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(helsinkiDateTime.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const year = Number(getDateTimePart(parts, 'year'))
  const month = Number(getDateTimePart(parts, 'month'))
  const day = Number(getDateTimePart(parts, 'day'))
  const hour = Number(getDateTimePart(parts, 'hour'))
  const minute = Number(getDateTimePart(parts, 'minute'))
  const second = Number(getDateTimePart(parts, 'second'))

  return (
    (Date.UTC(year, month - 1, day, hour, minute, second) - date.getTime()) /
    60_000
  )
}

function getDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  const part = parts.find((value) => value.type === type)

  if (part === undefined) {
    throw new Error(`Missing date part: ${type}`)
  }

  return part.value
}

import type { BookingCalendarEvent } from './calendar-event'

const CALENDAR_FILE_TYPE = 'text/calendar;charset=utf-8'

export function serializeCalendarEvent(event: BookingCalendarEvent): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Laguuni Quickbook//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Helsinki',
    'X-LIC-LOCATION:Europe/Helsinki',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0300',
    'TZNAME:EEST',
    'DTSTART:19700329T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0200',
    'TZNAME:EET',
    'DTSTART:19701025T040000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${escapeText(event.uid)}`,
    `DTSTAMP:${event.stampUtc}`,
    `DTSTART;TZID=${event.timeZone}:${event.startsAtLocal}`,
    `DTEND;TZID=${event.timeZone}:${event.endsAtLocal}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function createBookingCalendarFile(event: BookingCalendarEvent): File {
  return new File([serializeCalendarEvent(event)], event.fileName, {
    type: CALENDAR_FILE_TYPE,
  })
}

function escapeText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\n')
}

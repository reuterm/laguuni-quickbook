import type { BookingCalendarEvent } from './calendar-event'

const CALENDAR_FILE_TYPE = 'text/calendar;charset=utf-8'
const HELSINKI_TIME_ZONE = 'Europe/Helsinki'
const MAX_CONTENT_LINE_OCTETS = 75

export function serializeCalendarEvent(event: BookingCalendarEvent): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Laguuni Quickbook//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${HELSINKI_TIME_ZONE}`,
    `X-LIC-LOCATION:${HELSINKI_TIME_ZONE}`,
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
    `DTSTART;TZID=${HELSINKI_TIME_ZONE}:${event.startsAtLocal}`,
    `DTEND;TZID=${HELSINKI_TIME_ZONE}:${event.endsAtLocal}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
    .flatMap(foldLine)
    .join('\r\n')
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

function foldLine(line: string): string[] {
  const foldedLines: string[] = []
  let currentLine = ''

  for (const character of line) {
    const nextLine = currentLine + character

    if (getOctetLength(nextLine) > MAX_CONTENT_LINE_OCTETS) {
      foldedLines.push(currentLine)
      currentLine = ` ${character}`
      continue
    }

    currentLine = nextLine
  }

  foldedLines.push(currentLine)

  return foldedLines
}

function getOctetLength(value: string): number {
  return new TextEncoder().encode(value).length
}

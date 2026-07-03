import { describe, expect, it } from 'vitest'

import type { BookingCalendarEvent } from './calendar-event'
import { createBookingCalendarFile, serializeCalendarEvent } from './ical'

const calendarEvent: BookingCalendarEvent = {
  description:
    'Wakeboarding booking for Pro, line 1; bring vest\\rope.\nMeet at dock.',
  endsAtLocal: '20260514T160000',
  fileName: 'laguuni-booking-2026-05-14-1500.ics',
  location: 'Laguuni, Helsinki; Cable Park',
  stampUtc: '20260514T120000Z',
  startsAtLocal: '20260514T150000',
  timeZone: 'Europe/Helsinki',
  title: 'Wakeboarding - Pro, Main; Session',
  uid: 'laguuni-booking-2026-05-14-1500-pro',
}

describe('ical', () => {
  it('serializes a Helsinki booking event into an .ics payload', () => {
    expect(serializeCalendarEvent(calendarEvent)).toBe(
      [
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
        'UID:laguuni-booking-2026-05-14-1500-pro',
        'DTSTAMP:20260514T120000Z',
        'DTSTART;TZID=Europe/Helsinki:20260514T150000',
        'DTEND;TZID=Europe/Helsinki:20260514T160000',
        'SUMMARY:Wakeboarding - Pro\\, Main\\; Session',
        'DESCRIPTION:Wakeboarding booking for Pro\\, line 1\\; bring vest\\\\rope.\\nMeet at dock.',
        'LOCATION:Laguuni\\, Helsinki\\; Cable Park',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    )
  })

  it('wraps the serialized calendar payload in a browser File', async () => {
    const file = createBookingCalendarFile(calendarEvent)

    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('laguuni-booking-2026-05-14-1500.ics')
    expect(file.type).toBe('text/calendar;charset=utf-8')
    await expect(file.text()).resolves.toBe(serializeCalendarEvent(calendarEvent))
  })
})

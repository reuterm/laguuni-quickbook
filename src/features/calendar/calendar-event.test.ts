import { describe, expect, it } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { createBookingCalendarEvent } from './calendar-event'

describe('calendar-event', () => {
  it('maps a booking selection into a Helsinki calendar event', () => {
    expect(
      createBookingCalendarEvent({
        cableId: 'pro',
        date: localDate('2026-05-14'),
        endTime: '16:00',
        startTime: '15:00',
      }),
    ).toEqual({
      description: 'Wakeboarding booking for Pro on 2026-05-14 at 15:00-16:00.',
      endsAtLocal: '20260514T160000',
      fileName: 'laguuni-booking-2026-05-14-1500.ics',
      location: 'Laguuni',
      stampUtc: '20260514T120000Z',
      startsAtLocal: '20260514T150000',
      timeZone: 'Europe/Helsinki',
      title: 'Wakeboarding - Pro',
      uid: 'laguuni-booking-2026-05-14-1500-pro',
    })
  })

  it('derives the UTC stamp from Helsinki local time across winter offset changes', () => {
    expect(
      createBookingCalendarEvent({
        cableId: 'easy',
        date: localDate('2026-01-14'),
        endTime: '10:00',
        startTime: '09:00',
      }).stampUtc,
    ).toBe('20260114T070000Z')
  })
})

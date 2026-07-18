import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import type { BookingSlotSelection } from '../../domain/booking'
import { createBookingCalendarEvent } from './calendar-event'

describe('calendar-event', () => {
  const selection: BookingSlotSelection = {
    cableId: 'pro',
    date: localDate('2026-05-14'),
    endTime: '16:00',
    startTime: '15:00',
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps a booking selection into a Helsinki calendar event', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T10:20:30.000Z'))

    expect(createBookingCalendarEvent(selection, 'fixture-order-id')).toEqual({
      description: 'Wakeboarding booking for Pro on 2026-05-14 at 15:00-16:00.',
      endsAtLocal: '20260514T160000',
      fileName: 'laguuni-booking-2026-05-14-1500.ics',
      location: 'Laguuni',
      stampUtc: '20260501T102030Z',
      startsAtLocal: '20260514T150000',
      timeZone: 'Europe/Helsinki',
      title: 'Wakeboarding - Pro',
      uid: 'laguuni-booking-fixture-order-id',
    })
  })

  it('uses the current UTC time as the calendar record timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T10:20:30.000Z'))

    expect(
      createBookingCalendarEvent(selection, 'fixture-order-id').stampUtc,
    ).toBe('20260501T102030Z')
  })

  it('uses the following local date when a booking ends at midnight', () => {
    const event = createBookingCalendarEvent(
      {
        cableId: 'pro',
        date: localDate('2026-06-02'),
        endTime: '00:00',
        startTime: '23:00',
      },
      'fixture-order-id',
    )

    expect(event.startsAtLocal).toBe('20260602T230000')
    expect(event.endsAtLocal).toBe('20260603T000000')
  })
})

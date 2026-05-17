import { describe, expect, it } from 'vitest'
import easyAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/easy.json'
import proAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/pro.json'
import { localDate } from '../../../tests/local-date'
import {
  decodeAvailableDatesResponse,
  decodeAvailableTimesResponse,
  normalizeAvailableDates,
  normalizeDailyAvailabilityWindow,
} from './normalize'

describe('normalizeAvailableDates', () => {
  it('maps monthly day tuples into ISO dates', () => {
    const normalizedDates = normalizeAvailableDates(
      'pro',
      localDate('2026-05-03'),
      decodeAvailableDatesResponse(proAvailabilityFixture.availableDates),
    )

    expect(normalizedDates.map((availableDate) => availableDate.date)).toEqual(
      expect.arrayContaining(['2026-05-08', '2026-05-22']),
    )
  })
})

describe('normalizeDailyAvailabilityWindow', () => {
  it('uses storefront start times for bookable one-hour slots', () => {
    const availabilityWindow = normalizeDailyAvailabilityWindow(
      'easy',
      localDate('2026-05-03'),
      decodeAvailableTimesResponse(
        easyAvailabilityFixture.availableTimesCapacity,
      ),
    )

    expect(availabilityWindow).toMatchObject({
      cableId: 'easy',
      date: '2026-05-03',
    })
    expect(availabilityWindow.bookingSegments[1]).toEqual({
      endMinute: 840,
      isBookable: true,
      startMinute: 780,
    })
    expect(availabilityWindow.capacitySegments[1]).toEqual({
      endMinute: 900,
      freeCapacity: 2,
      startMinute: 720,
    })
    expect(easyAvailabilityFixture.availableDates).toHaveLength(20)
  })
})

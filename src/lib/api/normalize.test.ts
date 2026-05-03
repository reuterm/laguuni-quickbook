import { describe, expect, it } from 'vitest'
import easyAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/easy.json'
import proAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/pro.json'
import {
  decodeAvailableDatesResponse,
  decodeAvailableTimesResponse,
  normalizeAvailableDates,
  normalizeDailyAvailabilityWindow,
} from './normalize'

describe('normalizeAvailableDates', () => {
  it('maps monthly day tuples into ISO dates', () => {
    expect(
      normalizeAvailableDates(
        'pro',
        '2026-05-03',
        decodeAvailableDatesResponse(proAvailabilityFixture.availableDates),
      ),
    ).toEqual(
      expect.arrayContaining([
        {
          cableId: 'pro',
          date: '2026-05-08',
          hasBookableSlots: true,
        },
        {
          cableId: 'pro',
          date: '2026-05-22',
          hasBookableSlots: false,
        },
      ]),
    )
  })
})

describe('normalizeDailyAvailabilityWindow', () => {
  it('keeps booking and capacity segments separate', () => {
    const availabilityWindow = normalizeDailyAvailabilityWindow(
      'easy',
      '2026-05-03',
      decodeAvailableTimesResponse(easyAvailabilityFixture.availableTimesCount),
      decodeAvailableTimesResponse(
        easyAvailabilityFixture.availableTimesCapacity,
      ),
    )

    expect(availabilityWindow.startTimes).toEqual([])
    expect(availabilityWindow.endTimesByStartTime).toEqual({})
    expect(availabilityWindow.bookingSegments[1]).toEqual({
      endMinute: 900,
      isBookable: true,
      startMinute: 720,
    })
    expect(availabilityWindow.capacitySegments[1]).toEqual({
      endMinute: 900,
      freeCapacity: 0,
      startMinute: 720,
    })
    expect(availabilityWindow.tomorrowBookingSegments).toHaveLength(3)
    expect(easyAvailabilityFixture.availableDates).toHaveLength(20)
  })
})

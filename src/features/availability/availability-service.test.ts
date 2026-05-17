import { describe, expect, it, vi } from 'vitest'
import type { CableId } from '@/domain/cable'
import type { DailyAvailabilityWindow } from '@/domain/slot'
import type { LaguuniApi } from '@/lib/api/laguuni-api'
import type { LocalDateString } from '@/lib/date'
import { localDate } from '../../../tests/local-date'
import {
  AVAILABILITY_INITIAL_RANGE_DAY_COUNT,
  createAvailabilitySlots,
  loadAvailabilityDay,
  loadAvailabilityOverview,
  loadAvailabilityWeek,
} from './availability-service'

describe('loadAvailabilityOverview', () => {
  it('loads whole calendar weeks across month boundaries', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates: unexpectedApiCall,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    const dayGroups = await loadAvailabilityOverview(
      api,
      'pro',
      new Date('2026-05-29T12:00:00'),
      1,
    )

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(7)
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      1,
      'pro',
      '2026-05-25',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      7,
      'pro',
      '2026-05-31',
    )
    expect(dayGroups.map((dayGroup) => dayGroup.date)).toEqual([
      '2026-05-25',
      '2026-05-26',
      '2026-05-27',
      '2026-05-28',
      '2026-05-29',
      '2026-05-30',
      '2026-05-31',
    ])
  })

  it('loads the initial two-week range by default', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates: unexpectedApiCall,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    await loadAvailabilityOverview(api, 'pro', new Date('2026-05-26T12:00:00'))

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(
      AVAILABILITY_INITIAL_RANGE_DAY_COUNT,
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      14,
      'pro',
      '2026-06-07',
    )
  })
})

describe('loadAvailabilityWeek', () => {
  it('returns full-week metadata and keeps empty days in the result', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates: unexpectedApiCall,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    const weekPage = await loadAvailabilityWeek(
      api,
      'pro',
      new Date('2026-05-29T12:00:00'),
    )

    expect(weekPage.weekId).toBe('2026-05-25')
    expect(weekPage.hasBookableSlots).toBe(true)
    expect(weekPage.dayGroups).toHaveLength(7)
    expect(weekPage.dayGroups[0]).toMatchObject({
      date: '2026-05-25',
      slots: [],
    })
    expect(weekPage.dayGroups[4]).toMatchObject({ date: '2026-05-29' })
  })
})

describe('loadAvailabilityDay', () => {
  it('loads a single day group without expanding to the surrounding week', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates: unexpectedApiCall,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    const dayGroup = await loadAvailabilityDay(
      api,
      'pro',
      localDate('2026-05-29'),
    )

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(1)
    expect(getDailyAvailabilityWindow).toHaveBeenCalledWith('pro', '2026-05-29')
    expect(dayGroup).toMatchObject({ date: '2026-05-29' })
  })
})

describe('createAvailabilitySlots', () => {
  it('falls back to four total capacity while fixture data only exposes free counts', () => {
    const dailyWindow: DailyAvailabilityWindow = {
      bookingSegments: [
        {
          endMinute: 840,
          isBookable: true,
          startMinute: 720,
        },
      ],
      cableId: 'pro',
      capacitySegments: [
        {
          endMinute: 840,
          freeCapacity: 1,
          startMinute: 720,
        },
      ],
      date: localDate('2026-05-03'),
    }

    expect(createAvailabilitySlots(dailyWindow)).toEqual([
      {
        endTime: '13:00',
        freeCapacity: 1,
        id: '2026-05-03-720',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-03'),
          endTime: '13:00',
          startTime: '12:00',
        },
        startTime: '12:00',
        totalCapacity: 4,
      },
      {
        endTime: '14:00',
        freeCapacity: 1,
        id: '2026-05-03-780',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-03'),
          endTime: '14:00',
          startTime: '13:00',
        },
        startTime: '13:00',
        totalCapacity: 4,
      },
    ])
  })

  it('derives slot starts from normalized bookable segments instead of sweeping the whole day', () => {
    const dailyWindow: DailyAvailabilityWindow = {
      bookingSegments: [
        {
          endMinute: 905,
          isBookable: true,
          startMinute: 725,
        },
      ],
      cableId: 'easy',
      capacitySegments: [
        {
          endMinute: 960,
          freeCapacity: 2,
          startMinute: 720,
        },
      ],
      date: localDate('2026-05-03'),
    }

    expect(createAvailabilitySlots(dailyWindow)).toEqual([
      {
        endTime: '14:00',
        freeCapacity: 2,
        id: '2026-05-03-780',
        selection: {
          cableId: 'easy',
          date: localDate('2026-05-03'),
          endTime: '14:00',
          startTime: '13:00',
        },
        startTime: '13:00',
        totalCapacity: 4,
      },
      {
        endTime: '15:00',
        freeCapacity: 2,
        id: '2026-05-03-840',
        selection: {
          cableId: 'easy',
          date: localDate('2026-05-03'),
          endTime: '15:00',
          startTime: '14:00',
        },
        startTime: '14:00',
        totalCapacity: 4,
      },
    ])
  })
})

const dailyAvailabilityByDate: Record<string, DailyAvailabilityWindow> = {
  '2026-05-29': createDailyAvailabilityWindow(localDate('2026-05-29')),
  '2026-06-01': createDailyAvailabilityWindow(localDate('2026-06-01')),
  '2026-06-04': createDailyAvailabilityWindow(localDate('2026-06-04')),
}

function createDailyAvailabilityWindow(
  date: LocalDateString,
): DailyAvailabilityWindow {
  return {
    bookingSegments: [
      {
        endMinute: 900,
        isBookable: true,
        startMinute: 780,
      },
    ],
    cableId: 'pro',
    capacitySegments: [
      {
        endMinute: 900,
        freeCapacity: 4,
        startMinute: 780,
      },
    ],
    date,
  }
}

function createEmptyDailyAvailabilityWindow(
  date: LocalDateString,
): DailyAvailabilityWindow {
  return {
    bookingSegments: [],
    cableId: 'pro',
    capacitySegments: [],
    date,
  }
}

async function unexpectedApiCall(): Promise<never> {
  throw new Error('This API method should not be used in this test')
}

import { describe, expect, it, vi } from 'vitest'
import type { CableId } from '@/domain/cable'
import type { AvailableDate, DailyAvailabilityWindow } from '@/domain/slot'
import type { LaguuniApi } from '@/lib/api/laguuni-api'
import type { LocalDateString } from '@/lib/date'
import { localDate } from '../../../tests/local-date'
import {
  createAvailabilitySlots,
  loadAvailabilityDay,
  loadAvailabilityOverview,
  loadAvailabilityWeek,
} from './availability-service'

describe('loadAvailabilityOverview', () => {
  it('loads whole calendar weeks across month boundaries', async () => {
    const getAvailableDates = vi.fn(createGetAvailableDates())
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      cancelMobilePayCheckout: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates,
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

    expect(getAvailableDates).toHaveBeenCalledTimes(1)
    expect(getAvailableDates).toHaveBeenCalledWith('pro', '2026-05-01')
    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(3)
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      1,
      'pro',
      '2026-05-27',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      3,
      'pro',
      '2026-05-29',
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
    const getAvailableDates = vi.fn(createGetAvailableDates())
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      cancelMobilePayCheckout: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    await loadAvailabilityOverview(api, 'pro', new Date('2026-05-26T12:00:00'))

    expect(getAvailableDates).toHaveBeenCalledTimes(2)
    expect(getAvailableDates).toHaveBeenNthCalledWith(1, 'pro', '2026-05-01')
    expect(getAvailableDates).toHaveBeenNthCalledWith(2, 'pro', '2026-06-01')
    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(5)
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      5,
      'pro',
      '2026-06-04',
    )
  })

  it('loads detailed availability for dates marked partial or bookable and skips omitted dates', async () => {
    const getAvailableDates = vi.fn(
      async (_cableId: CableId, anchorDate: LocalDateString) => {
        if (anchorDate !== localDate('2026-06-01')) {
          return []
        }

        return [
          createAvailableDate('2026-06-06', false),
          createAvailableDate('2026-06-07', true),
        ]
      },
    )
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ?? createDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      cancelMobilePayCheckout: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    const dayGroups = await loadAvailabilityOverview(
      api,
      'pro',
      new Date('2026-06-02T12:00:00'),
      1,
    )

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(2)
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      1,
      'pro',
      '2026-06-06',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      2,
      'pro',
      '2026-06-07',
    )
    expect(
      dayGroups.find((dayGroup) => dayGroup.date === localDate('2026-06-05'))
        ?.slots,
    ).toEqual([])
    expect(
      dayGroups.find((dayGroup) => dayGroup.date === localDate('2026-06-06'))
        ?.slots.length,
    ).toBeGreaterThan(0)
    expect(
      dayGroups.find((dayGroup) => dayGroup.date === localDate('2026-06-07'))
        ?.slots.length,
    ).toBeGreaterThan(0)
  })
})

describe('loadAvailabilityWeek', () => {
  it('returns full-week metadata and keeps empty days in the result', async () => {
    const getAvailableDates = vi.fn(createGetAvailableDates())
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      cancelMobilePayCheckout: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates,
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
    const getAvailableDates = vi.fn(createGetAvailableDates())
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      cancelMobilePayCheckout: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates,
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

  it('returns an empty day group when the date is omitted from available dates', async () => {
    const getAvailableDates = vi.fn(async () => [] as readonly AvailableDate[])
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) =>
        createDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      cancelMobilePayCheckout: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi

    const dayGroup = await loadAvailabilityDay(
      api,
      'pro',
      localDate('2026-06-03'),
    )

    expect(getDailyAvailabilityWindow).not.toHaveBeenCalled()
    expect(dayGroup).toEqual({
      date: localDate('2026-06-03'),
      displayDate: 'Wed 3 Jun',
      slots: [],
    })
  })
})

describe('createAvailabilitySlots', () => {
  it('falls back to four total capacity while fixture data only exposes free counts', () => {
    const dailyWindow: DailyAvailabilityWindow = {
      bookingSegments: [
        {
          endMinute: 780,
          isBookable: true,
          startMinute: 720,
        },
        {
          endMinute: 840,
          isBookable: true,
          startMinute: 780,
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

  it('preserves exact normalized bookable segment starts', () => {
    const dailyWindow: DailyAvailabilityWindow = {
      bookingSegments: [
        {
          endMinute: 785,
          isBookable: true,
          startMinute: 725,
        },
        {
          endMinute: 875,
          isBookable: true,
          startMinute: 815,
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
        endTime: '13:05',
        freeCapacity: 2,
        id: '2026-05-03-725',
        selection: {
          cableId: 'easy',
          date: localDate('2026-05-03'),
          endTime: '13:05',
          startTime: '12:05',
        },
        startTime: '12:05',
        totalCapacity: 4,
      },
      {
        endTime: '14:35',
        freeCapacity: 2,
        id: '2026-05-03-815',
        selection: {
          cableId: 'easy',
          date: localDate('2026-05-03'),
          endTime: '14:35',
          startTime: '13:35',
        },
        startTime: '13:35',
        totalCapacity: 4,
      },
    ])
  })

  it('keeps staggered one-hour slots', () => {
    const dailyWindow: DailyAvailabilityWindow = {
      bookingSegments: [
        {
          endMinute: 780,
          isBookable: true,
          startMinute: 720,
        },
        {
          endMinute: 870,
          isBookable: true,
          startMinute: 810,
        },
        {
          endMinute: 960,
          isBookable: true,
          startMinute: 900,
        },
        {
          endMinute: 1050,
          isBookable: true,
          startMinute: 990,
        },
        {
          endMinute: 1140,
          isBookable: true,
          startMinute: 1080,
        },
      ],
      cableId: 'pro',
      capacitySegments: [
        {
          endMinute: 1140,
          freeCapacity: 4,
          startMinute: 720,
        },
      ],
      date: localDate('2026-06-06'),
    }

    expect(
      createAvailabilitySlots(dailyWindow).map((slot) => slot.startTime),
    ).toEqual(['12:00', '13:30', '15:00', '16:30', '18:00'])
  })
})

const dailyAvailabilityByDate: Record<string, DailyAvailabilityWindow> = {
  '2026-06-06': createDailyAvailabilityWindow(localDate('2026-06-06')),
  '2026-06-07': createDailyAvailabilityWindow(localDate('2026-06-07')),
  '2026-05-29': createDailyAvailabilityWindow(localDate('2026-05-29')),
  '2026-06-01': createDailyAvailabilityWindow(localDate('2026-06-01')),
  '2026-06-04': createDailyAvailabilityWindow(localDate('2026-06-04')),
}

function createAvailableDate(
  date: string,
  hasBookableSlots: boolean,
): AvailableDate {
  return {
    cableId: 'pro',
    date: localDate(date),
    hasBookableSlots,
  }
}

function createGetAvailableDates() {
  return async (_cableId: CableId, anchorDate: LocalDateString) => {
    if (anchorDate === localDate('2026-05-01')) {
      return [
        createAvailableDate('2026-05-27', false),
        createAvailableDate('2026-05-28', true),
        createAvailableDate('2026-05-29', true),
      ]
    }

    if (anchorDate === localDate('2026-06-01')) {
      return [
        createAvailableDate('2026-06-01', false),
        createAvailableDate('2026-06-04', true),
      ]
    }

    return []
  }
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

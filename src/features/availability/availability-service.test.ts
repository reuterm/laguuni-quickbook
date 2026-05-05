import { describe, expect, it, vi } from 'vitest'

import type { CableId } from '../../domain/cable'
import type { DailyAvailabilityWindow } from '../../domain/slot'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import {
  createAvailabilitySlots,
  loadAvailabilityOverview,
} from './availability-service'

describe('loadAvailabilityOverview', () => {
  it('loads only the next seven days of availability across month boundaries', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: string) =>
        dailyAvailabilityByDate[date] ??
        createEmptyDailyAvailabilityWindow(date),
    )
    const api = {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      createBasket: unexpectedApiCall,
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
    )

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(7)
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      1,
      'pro',
      '2026-05-29',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      2,
      'pro',
      '2026-05-30',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      3,
      'pro',
      '2026-05-31',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      4,
      'pro',
      '2026-06-01',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      5,
      'pro',
      '2026-06-02',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      6,
      'pro',
      '2026-06-03',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      7,
      'pro',
      '2026-06-04',
    )
    expect(dayGroups.map((dayGroup) => dayGroup.date)).toEqual([
      '2026-05-29',
      '2026-06-01',
      '2026-06-04',
    ])
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
      date: '2026-05-03',
    }

    expect(createAvailabilitySlots(dailyWindow)).toEqual([
      {
        endTime: '13:00',
        freeCapacity: 1,
        id: '2026-05-03-720',
        selection: {
          cableId: 'pro',
          date: '2026-05-03',
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
          date: '2026-05-03',
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
      date: '2026-05-03',
    }

    expect(createAvailabilitySlots(dailyWindow)).toEqual([
      {
        endTime: '14:00',
        freeCapacity: 2,
        id: '2026-05-03-780',
        selection: {
          cableId: 'easy',
          date: '2026-05-03',
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
          date: '2026-05-03',
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
  '2026-05-29': createDailyAvailabilityWindow('2026-05-29'),
  '2026-06-01': createDailyAvailabilityWindow('2026-06-01'),
  '2026-06-04': createDailyAvailabilityWindow('2026-06-04'),
}

function createDailyAvailabilityWindow(date: string): DailyAvailabilityWindow {
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
  date: string,
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

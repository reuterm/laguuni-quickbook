import { describe, expect, it } from 'vitest'

import type { DailyAvailabilityWindow } from '../../domain/slot'
import { createAvailabilitySlots } from './availability-service'

describe('createAvailabilitySlots', () => {
  it('formats free capacity from occupied-capacity segments', () => {
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
          occupiedCapacity: 1,
          startMinute: 720,
        },
      ],
      date: '2026-05-03',
    }

    expect(createAvailabilitySlots(dailyWindow)).toEqual([
      {
        availabilityLabel: '3/4 free',
        endTime: '13:00',
        id: '2026-05-03-720',
        selection: {
          cableId: 'pro',
          date: '2026-05-03',
          endTime: '13:00',
          productId: '6',
          startTime: '12:00',
        },
        startTime: '12:00',
      },
      {
        availabilityLabel: '3/4 free',
        endTime: '14:00',
        id: '2026-05-03-780',
        selection: {
          cableId: 'pro',
          date: '2026-05-03',
          endTime: '14:00',
          productId: '6',
          startTime: '13:00',
        },
        startTime: '13:00',
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
          occupiedCapacity: 2,
          startMinute: 720,
        },
      ],
      date: '2026-05-03',
    }

    expect(createAvailabilitySlots(dailyWindow)).toEqual([
      {
        availabilityLabel: '2/4 free',
        endTime: '14:00',
        id: '2026-05-03-780',
        selection: {
          cableId: 'easy',
          date: '2026-05-03',
          endTime: '14:00',
          productId: '7',
          startTime: '13:00',
        },
        startTime: '13:00',
      },
      {
        availabilityLabel: '2/4 free',
        endTime: '15:00',
        id: '2026-05-03-840',
        selection: {
          cableId: 'easy',
          date: '2026-05-03',
          endTime: '15:00',
          productId: '7',
          startTime: '14:00',
        },
        startTime: '14:00',
      },
    ])
  })
})

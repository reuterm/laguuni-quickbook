import { describe, expect, it, vi } from 'vitest'

import { exportDeveloperCalendarFixture } from './developer-calendar-export'

const { exportBookingCalendarMock } = vi.hoisted(() => ({
  exportBookingCalendarMock: vi.fn(async () => 'shared' as const),
}))

vi.mock('../calendar/booking-calendar-export', () => ({
  exportBookingCalendar: exportBookingCalendarMock,
}))

describe('developer-calendar-export', () => {
  it('exports a two-day mixed-cable fixture through the booking exporter', async () => {
    await expect(exportDeveloperCalendarFixture()).resolves.toBe('shared')

    expect(exportBookingCalendarMock).toHaveBeenCalledWith(
      [
        {
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        },
        {
          cableId: 'easy',
          date: '2026-05-21',
          endTime: '11:00',
          startTime: '10:00',
        },
      ],
      'developer-calendar-export',
    )
  })
})

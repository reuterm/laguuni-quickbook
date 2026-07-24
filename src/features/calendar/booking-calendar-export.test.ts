import { describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { exportBookingCalendar } from './booking-calendar-export'

const { shareOrDownloadCalendarFileMock } = vi.hoisted(() => ({
  shareOrDownloadCalendarFileMock: vi.fn<
    (
      _file: File,
      _options: { text: string; title: string },
    ) => Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>
  >(async () => 'shared'),
}))

vi.mock('./calendar-share', () => ({
  shareOrDownloadCalendarFile: shareOrDownloadCalendarFileMock,
}))

describe('booking-calendar-export', () => {
  it('shares every selection in one calendar file', async () => {
    const result = await exportBookingCalendar(
      [
        {
          cableId: 'pro',
          date: localDate('2026-05-20'),
          endTime: '16:00',
          startTime: '15:00',
        },
        {
          cableId: 'easy',
          date: localDate('2026-05-21'),
          endTime: '11:00',
          startTime: '10:00',
        },
      ],
      'calendar-export-test',
    )

    expect(result).toBe('shared')
    const [file] = shareOrDownloadCalendarFileMock.mock.calls[0] ?? []
    expect(file).toBeInstanceOf(File)
    if (!file) {
      throw new Error('Expected a calendar file to be shared.')
    }
    await expect(file.text()).resolves.toContain('SUMMARY:Wakeboarding - Pro')
    await expect(file.text()).resolves.toContain('SUMMARY:Wakeboarding - Easy')
  })
})

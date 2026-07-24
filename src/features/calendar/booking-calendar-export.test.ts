import { describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { exportBookingCalendar } from './booking-calendar-export'

const { downloadCalendarFileMock } = vi.hoisted(() => ({
  downloadCalendarFileMock: vi.fn<
    (_file: File) => Promise<'downloaded' | 'failed'>
  >(async () => 'downloaded'),
}))

vi.mock('./calendar-download', () => ({
  downloadCalendarFile: downloadCalendarFileMock,
}))

describe('booking-calendar-export', () => {
  it('downloads every selection in one calendar file', async () => {
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

    expect(result).toBe('downloaded')
    expect(downloadCalendarFileMock).toHaveBeenCalledOnce()
    expect(downloadCalendarFileMock.mock.calls[0]).toHaveLength(1)
    const [file] = downloadCalendarFileMock.mock.calls[0] ?? []
    expect(file).toBeInstanceOf(File)
    if (!file) {
      throw new Error('Expected a calendar file to be downloaded.')
    }
    await expect(file.text()).resolves.toContain('SUMMARY:Wakeboarding - Pro')
    await expect(file.text()).resolves.toContain('SUMMARY:Wakeboarding - Easy')
  })
})

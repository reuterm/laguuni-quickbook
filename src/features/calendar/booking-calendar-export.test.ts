import { describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { exportBookingCalendar } from './booking-calendar-export'

const { shareOrDownloadCalendarFileMock } = vi.hoisted(() => ({
  shareOrDownloadCalendarFileMock: vi.fn<
    (
      _file: File,
      _options: { text: string; title: string },
      _observer?: import('./calendar-share').CalendarShareObserver,
    ) => Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>
  >(async () => 'shared'),
}))

vi.mock('./calendar-share', () => ({
  observeCalendarShare: (
    observer: ((event: unknown) => void) | undefined,
    event: unknown,
  ) => {
    try {
      observer?.(event)
    } catch {
      // Match the production guarantee that observers cannot interrupt export.
    }
  },
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

  it('observes file metadata and selection count before sharing', async () => {
    const observer = vi.fn()

    await exportBookingCalendar(
      [
        {
          cableId: 'pro',
          date: localDate('2026-05-20'),
          endTime: '16:00',
          startTime: '15:00',
        },
      ],
      'calendar-export-test',
      observer,
    )

    const [file, , forwardedObserver] =
      shareOrDownloadCalendarFileMock.mock.calls.at(-1) ?? []

    expect(observer).toHaveBeenCalledWith({
      type: 'calendar-export-prepared',
      fileName: 'laguuni-booking-calendar-export-test.ics',
      fileType: 'text/calendar;charset=utf-8',
      fileSize: expect.any(Number),
      selectionCount: 1,
    })
    expect(file).toBeInstanceOf(File)
    expect(forwardedObserver).toBe(observer)
  })

  it('continues sharing when the export observer throws', async () => {
    const observer = vi.fn(() => {
      throw new Error('diagnostics failed')
    })

    await expect(
      exportBookingCalendar([], 'calendar-export-test', observer),
    ).resolves.toBe('shared')

    expect(shareOrDownloadCalendarFileMock).toHaveBeenLastCalledWith(
      expect.any(File),
      {
        text: 'Add bookings to your calendar.',
        title: 'Add to calendar',
      },
      observer,
    )
  })
})

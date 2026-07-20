import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { useBookingCalendarAction } from './use-booking-calendar-action'

const { shareOrDownloadCalendarFileMock } = vi.hoisted(() => ({
  shareOrDownloadCalendarFileMock: vi.fn<
    (
      _file: File,
      _options: { text: string; title: string },
    ) => Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>
  >(async () => 'downloaded'),
}))

vi.mock('./calendar-share', () => ({
  shareOrDownloadCalendarFile: shareOrDownloadCalendarFileMock,
}))

afterEach(() => {
  shareOrDownloadCalendarFileMock.mockClear()
})

describe('useBookingCalendarAction', () => {
  it('shares every selection in one calendar file', async () => {
    const selections = [
      {
        cableId: 'pro',
        date: localDate('2026-05-20'),
        endTime: '16:00',
        startTime: '15:00',
      },
      {
        cableId: 'easy',
        date: localDate('2026-05-22'),
        endTime: '11:00',
        startTime: '10:00',
      },
    ] as const
    const { result } = renderHook(() =>
      useBookingCalendarAction(selections, 'fixture-order-id'),
    )

    await act(() => result.current.addToCalendar())

    const [file] = shareOrDownloadCalendarFileMock.mock.calls[0] ?? []
    expect(file).toBeInstanceOf(File)
    if (!file) {
      throw new Error('Expected a calendar file to be shared.')
    }
    await expect(file.text()).resolves.toContain(
      'UID:laguuni-booking-fixture-order-id-2026-05-20',
    )
    await expect(file.text()).resolves.toContain(
      'UID:laguuni-booking-fixture-order-id-2026-05-22',
    )
  })
})

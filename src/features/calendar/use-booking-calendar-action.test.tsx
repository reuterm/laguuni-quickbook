import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { useBookingCalendarAction } from './use-booking-calendar-action'

const { exportBookingCalendarMock } = vi.hoisted(() => ({
  exportBookingCalendarMock: vi.fn<
    (
      _selections: readonly import('../../domain/booking').BookingSlotSelection[],
      _bookingIdentifier: string,
    ) => Promise<'downloaded' | 'failed'>
  >(async () => 'downloaded'),
}))

vi.mock('./booking-calendar-export', () => ({
  exportBookingCalendar: exportBookingCalendarMock,
}))

afterEach(() => {
  exportBookingCalendarMock.mockClear()
})

describe('useBookingCalendarAction', () => {
  it('exports every selection through the calendar download', async () => {
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

    expect(exportBookingCalendarMock).toHaveBeenCalledWith(
      selections,
      'fixture-order-id',
    )
  })
})

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { BookingSlotSelection } from '@/domain/booking'
import { useBookingBasket } from './use-booking-basket'

function selection(
  date: BookingSlotSelection['date'],
  startTime: string,
  endTime: string,
): BookingSlotSelection {
  return {
    cableId: 'pro',
    date,
    startTime,
    endTime,
  }
}

describe('useBookingBasket', () => {
  it('replaces the selected slot on the same date', () => {
    const { result } = renderHook(() => useBookingBasket())
    const first = selection('2026-05-14', '15:00', '16:00')
    const replacement = selection('2026-05-14', '16:00', '17:00')

    act(() => result.current.addSelection(first))
    act(() => result.current.addSelection(replacement))

    expect(result.current.selections).toEqual([replacement])
    expect(result.current.isSelected(first)).toBe(false)
    expect(result.current.isSelected(replacement)).toBe(true)
  })

  it('does not clear newer selections with a stale revision', () => {
    const { result } = renderHook(() => useBookingBasket())
    const revision = result.current.revision
    const selected = selection('2026-05-15', '17:00', '18:00')

    act(() => result.current.addSelection(selected))
    act(() => result.current.clearSelectionsIfUnchanged(revision))

    expect(result.current.selections).toEqual([selected])
  })

})

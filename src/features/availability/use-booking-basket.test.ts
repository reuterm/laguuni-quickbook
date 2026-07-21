import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { BookingSlotSelection } from '@/domain/booking'
import { useBookingBasket } from './use-booking-basket'

function selection(
  date: BookingSlotSelection['date'],
  startTime: string,
  endTime: string,
  cableId = 'pro',
): BookingSlotSelection {
  return {
    cableId,
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

  it('removes only the selection with the matching cable key', () => {
    const { result } = renderHook(() => useBookingBasket())
    const selected = selection('2026-05-16', '10:00', '11:00', 'pro')
    const otherCable = selection('2026-05-16', '10:00', '11:00', 'ultra')

    act(() => result.current.addSelection(selected))
    act(() => result.current.removeSelection(otherCable))

    expect(result.current.selections).toEqual([selected])
    expect(result.current.isSelected(selected)).toBe(true)

    act(() => result.current.removeSelection(selected))

    expect(result.current.selections).toEqual([])
  })

  it('clears all selections', () => {
    const { result } = renderHook(() => useBookingBasket())
    const selected = selection('2026-05-17', '11:00', '12:00')

    act(() => result.current.addSelection(selected))
    act(() => result.current.clearSelections())

    expect(result.current.selections).toEqual([])
  })

  it('clears selections when the revision is unchanged', () => {
    const { result } = renderHook(() => useBookingBasket())
    const selected = selection('2026-05-18', '12:00', '13:00')

    act(() => result.current.addSelection(selected))
    const revision = result.current.revision
    act(() => result.current.clearSelectionsIfUnchanged(revision))

    expect(result.current.selections).toEqual([])
  })

})

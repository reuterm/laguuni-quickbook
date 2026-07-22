import { describe, expect, it } from 'vitest'
import { toLocalDateString } from '@/lib/date'
import {
  getBookingReplacementMessage,
  getSelectionForDate,
} from './booking-replacement'

describe('booking replacement helpers', () => {
  const proSelection = {
    cableId: 'pro' as const,
    date: toLocalDateString('2026-05-14'),
    endTime: '16:00',
    startTime: '15:00',
  }
  const easySelection = {
    cableId: 'easy' as const,
    date: toLocalDateString('2026-05-14'),
    endTime: '18:00',
    startTime: '17:00',
  }

  it('returns the selection for the requested date', () => {
    expect(getSelectionForDate([proSelection], proSelection.date)).toBe(
      proSelection,
    )
    expect(
      getSelectionForDate([proSelection], toLocalDateString('2026-05-15')),
    ).toBeUndefined()
  })

  it('formats a message for replacing a booking with another cable', () => {
    expect(
      getBookingReplacementMessage({
        current: proSelection,
        proposed: easySelection,
      }),
    ).toBe('Replace Pro 15:00-16:00 on Thu 14 May with Easy 17:00-18:00?')
  })
})

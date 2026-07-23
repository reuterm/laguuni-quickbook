import { describe, expect, it } from 'vitest'
import { toLocalDateString } from '@/lib/date'
import {
  getBookingReplacementDecision,
  getBookingReplacementMessage,
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

  it('adds when no selection exists for the proposed date', () => {
    expect(getBookingReplacementDecision([], proSelection)).toEqual({
      kind: 'add',
    })
  })

  it('adds when the selection for the proposed date uses the same cable', () => {
    const laterProSelection = {
      ...proSelection,
      endTime: '17:00',
      startTime: '16:00',
    }

    expect(
      getBookingReplacementDecision([proSelection], laterProSelection),
    ).toEqual({ kind: 'add' })
  })

  it('requires confirmation when the selection for the proposed date uses another cable', () => {
    expect(
      getBookingReplacementDecision([proSelection], easySelection),
    ).toEqual({
      current: proSelection,
      kind: 'confirm',
    })
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

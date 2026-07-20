import { describe, expect, it } from 'vitest'
import { localDate } from '../../../tests/local-date'

import {
  getBookingSelectionsPresentation,
  getBookingSlotSelectionKey,
} from './booking-selections'

describe('booking-selections', () => {
  it('sorts mixed-cable selections and exposes cable-aware rows', () => {
    expect(
      getBookingSelectionsPresentation([
        {
          cableId: 'easy',
          date: localDate('2026-05-22'),
          endTime: '16:00',
          startTime: '15:00',
        },
        {
          cableId: 'pro',
          date: localDate('2026-05-20'),
          endTime: '11:00',
          startTime: '10:00',
        },
      ]),
    ).toEqual({
      label: '2 slots',
      rows: [
        {
          cableLabel: 'Pro',
          dateLabel: 'Wed, 20 May',
          timeLabel: '10:00-11:00',
        },
        {
          cableLabel: 'Easy',
          dateLabel: 'Fri, 22 May',
          timeLabel: '15:00-16:00',
        },
      ],
    })
  })

  it('creates a key that distinguishes cable-aware selections', () => {
    expect(
      getBookingSlotSelectionKey({
        cableId: 'pro',
        date: localDate('2026-05-20'),
        endTime: '11:00',
        startTime: '10:00',
      }),
    ).toBe('pro:2026-05-20:10:00:11:00')
  })
})

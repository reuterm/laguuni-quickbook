import { describe, expect, it } from 'vitest'
import { localDate } from '../../../tests/local-date'

import {
  formatBookingSelectionDate,
  formatBookingSelectionLabel,
  getBookingSelectionPresentation,
} from './booking-selection-label'

const selection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-20'),
  endTime: '16:00',
  startTime: '15:00',
}

describe('booking-selection-label', () => {
  it('formats the selection date for display', () => {
    expect(formatBookingSelectionDate(localDate('2026-05-20'))).toBe(
      'Wed 20 May',
    )
  })

  it('formats the full booking selection label', () => {
    expect(formatBookingSelectionLabel(selection)).toBe(
      'Pro on Wed 20 May at 15:00-16:00',
    )
  })

  it('builds booking selection summary rows', () => {
    expect(getBookingSelectionPresentation(selection)).toEqual({
      label: 'Pro on Wed 20 May at 15:00-16:00',
      rows: [
        { label: 'Cable', value: 'Pro' },
        { label: 'Date', value: 'Wed 20 May' },
        { label: 'Time', value: '15:00-16:00' },
      ],
    })
  })
})

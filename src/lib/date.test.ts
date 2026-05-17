import { describe, expect, it } from 'vitest'

import { formatMinuteOfDay } from './date'

describe('date', () => {
  it('formats minutes of day as 24-hour time', () => {
    expect(formatMinuteOfDay(0)).toBe('00:00')
    expect(formatMinuteOfDay(75)).toBe('01:15')
    expect(formatMinuteOfDay(1439)).toBe('23:59')
  })
})

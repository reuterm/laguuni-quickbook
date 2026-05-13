import { describe, expect, it } from 'vitest'

import { getBalancedDayColumnCount } from './AvailabilityDayGroups'

describe('getBalancedDayColumnCount', () => {
  it('returns one column before any width measurement is available', () => {
    expect(getBalancedDayColumnCount(5, 0)).toBe(1)
  })

  it('switches to two columns once two minimum cards fit', () => {
    expect(getBalancedDayColumnCount(5, 632)).toBe(2)
  })

  it('steps down from four columns to three when four would leave one orphan card', () => {
    expect(getBalancedDayColumnCount(5, 1272)).toBe(3)
  })

  it('keeps four columns when the last row would not orphan a single card', () => {
    expect(getBalancedDayColumnCount(8, 1272)).toBe(4)
  })

  it('keeps three columns when three columns already balance the rows', () => {
    expect(getBalancedDayColumnCount(5, 960)).toBe(3)
  })

  it('uses the actual root font size when converting rem-based layout tokens', () => {
    expect(getBalancedDayColumnCount(5, 700, 20)).toBe(1)
    expect(getBalancedDayColumnCount(5, 768, 20)).toBe(2)
  })
})

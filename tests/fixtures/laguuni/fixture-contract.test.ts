import { describe, expect, it } from 'vitest'
import proAvailabilityFixture from './availability/pro.json'
import addToBasketFixture from './booking/add-to-basket-success.json'
import basketFixture from './booking/basket.json'
import discountInvalidFixture from './booking/discount-invalid.json'

describe('Laguuni fixture contracts', () => {
  it('keeps the basket bootstrap fixture as a plain token string', () => {
    expect(typeof basketFixture).toBe('string')
    expect(basketFixture.length).toBeGreaterThan(0)
  })

  it('keeps the add-to-basket fixture as a bare item identifier', () => {
    expect(typeof addToBasketFixture).toBe('number')
    expect(addToBasketFixture).toBeGreaterThan(0)
  })

  it('stores monthly availability fixtures as day tuples', () => {
    expect(
      proAvailabilityFixture.availableDates.every(
        (entry) =>
          Array.isArray(entry) &&
          entry.length === 2 &&
          typeof entry[0] === 'number' &&
          (entry[1] === 0 || entry[1] === 1),
      ),
    ).toBe(true)
  })

  it('stores availability range fixtures as tuple lists', () => {
    expect(
      proAvailabilityFixture.availableTimesCapacity.tuples.every(
        (entry) =>
          Array.isArray(entry) &&
          entry.length === 3 &&
          entry.every((value) => typeof value === 'number'),
      ),
    ).toBe(true)
  })

  it('keeps real invalid code fixtures reviewable', () => {
    expect(discountInvalidFixture).toEqual({
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Antamasi koodi on virheellinen.',
      status: 'error',
    })
  })
})

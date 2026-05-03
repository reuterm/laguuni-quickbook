import { describe, expect, it, vi } from 'vitest'

import type { LaguuniApi } from '../../lib/api/laguuni-api'
import { DefaultBookingService } from './booking-service'

const selection = {
  cableId: 'pro' as const,
  count: 1 as const,
  date: '14.5.2026',
  endTime: '16.00',
  productId: '6',
  reservationCount: 1 as const,
  resourceCount: 1 as const,
  startTime: '15.00',
}

const profile = {
  email: 'test@example.com',
  name: 'Test User',
  paymentMethod: 'bambora' as const,
  phone: '+358401234567',
  termsAccepted: true as const,
}

function createApiStub(): LaguuniApi {
  return {
    addReservationToBasket: vi.fn(async () => ({
      basket: 'fixture-basket-token',
      itemId: 'fixture-item-id',
      status: 'ok' as const,
    })),
    createBasket: vi.fn(async () => 'fixture-basket-token'),
    getAvailableDates: vi.fn(),
    getDailyAvailabilityWindow: vi.fn(),
    lookupCode: vi.fn(async () => ({
      payload: {
        code: 'FIXTURE-VOUCHER-ZERO',
        remainingValue: '0.00',
        status: 'ok' as const,
      },
      remainingBalanceCents: 0,
      source: 'voucher' as const,
      status: 'accepted' as const,
    })),
    submitCheckout: vi.fn(async () => ({
      orderId: 'fixture-order-id',
      status: 'success' as const,
    })),
  }
}

describe('DefaultBookingService', () => {
  it('runs the expected basket, code, and checkout sequence', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })

    await expect(
      service.book({
        code: 'FIXTURE-VOUCHER-ZERO',
        profile,
        selection,
      }),
    ).resolves.toEqual({
      orderId: 'fixture-order-id',
      status: 'success',
    })

    expect(api.createBasket).toHaveBeenCalledOnce()
    expect(api.addReservationToBasket).toHaveBeenCalledWith({
      basketToken: 'fixture-basket-token',
      selection,
    })
    expect(api.lookupCode).toHaveBeenCalledWith({
      basketToken: 'fixture-basket-token',
      code: 'FIXTURE-VOUCHER-ZERO',
    })
    expect(api.submitCheckout).toHaveBeenCalledOnce()
  })

  it('stops before checkout when the code is invalid', async () => {
    const api = createApiStub()

    vi.mocked(api.lookupCode).mockResolvedValueOnce({
      errorCode: 'GENERAL_ERROR',
      status: 'invalid',
    })

    const service = new DefaultBookingService({ api })

    await expect(
      service.book({
        code: 'INVALID',
        profile,
        selection,
      }),
    ).resolves.toEqual({
      reason: 'GENERAL_ERROR',
      status: 'failed',
    })

    expect(api.submitCheckout).not.toHaveBeenCalled()
  })
})

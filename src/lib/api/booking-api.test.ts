import { describe, expect, it } from 'vitest'

import type { BookingProfile, BookingSlotSelection } from '../../domain/booking'
import { addReservationToBasket, submitCheckout } from './booking-api'
import type { CheckoutResponseObservation } from './booking-contracts'
import type { HttpClient, HttpRequest, HttpResponse } from './client'

describe('booking-api transport mapping', () => {
  it('maps domain slot selections to storefront basket payloads', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, 249179)

    await expect(
      addReservationToBasket(client, {
        basketToken: 'fixture-basket-token',
        selection: {
          cableId: 'pro',
          date: '2026-05-14',
          endTime: '16:00',
          startTime: '15:00',
        } satisfies BookingSlotSelection,
      }),
    ).resolves.toEqual({
      itemId: '249179',
    })

    expect(requests[0]).toMatchObject({
      body: {
        count: 1,
        product_id: '6',
        reservation_count: 1,
        reservation_datestart: '14.5.2026',
        reservation_timeend: '16.00',
        reservation_timestart: '15.00',
        resource_count: 1,
        version: 'fi_FI',
      },
      method: 'POST',
      path: '/api/laguuni/fi_FI/baskets/fixture-basket-token/items/new.json',
    })
  })

  it('maps domain booking profiles to storefront checkout payloads', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, {
      order: 'fixture-order-id',
      status: 'ok',
    })

    await expect(
      submitCheckout(client, {
        basketToken: 'fixture-basket-token',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        } satisfies BookingProfile,
      }),
    ).resolves.toEqual({
      orderId: 'fixture-order-id',
      status: 'success',
    })

    expect(requests[0]).toMatchObject({
      body: {
        allowmarketing: 0,
        consolidated: 0,
        country: null,
        deliveryRules: [],
        email: 'test@example.com',
        master: 1,
        more: null,
        name: 'Test User',
        payment: 'bambora',
        phone: '+358401234567',
        terms_accepted: 1,
        version: 'fi_FI',
      },
      method: 'POST',
      path: '/api/laguuni/fi_FI/orders/fixture-basket-token.json',
    })
  })

  it('accepts unknown checkout success shapes and records a safe summary', async () => {
    const requests: HttpRequest<unknown>[] = []
    const observations: CheckoutResponseObservation[] = []
    const client = createCapturingClient(requests, {
      order: 12345,
      provider: 'bambora',
      redirectUrl: 'https://shop.laguuniin.fi/pay/fixture-payment-token',
      status: 'pending',
    })

    await expect(
      submitCheckout(client, {
        basketToken: 'fixture-basket-token',
        observeResponse: (observation) => {
          observations.push(observation)
        },
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        } satisfies BookingProfile,
      }),
    ).resolves.toEqual({
      orderId: '12345',
      redirectUrl: 'https://shop.laguuniin.fi/pay/fixture-payment-token',
      status: 'payment_required',
    })

    expect(observations).toEqual([
      {
        hasErrorCode: false,
        hasErrorMessage: false,
        normalizedStatus: 'ok',
        orderFieldKind: 'number',
        paymentRequiredFieldKind: 'missing',
        rawStatus: 'pending',
        redirectUrlFieldKind: 'string',
        responseKeys: 'order,provider,redirectUrl,status',
      },
    ])
  })
})

function createCapturingClient(
  requests: HttpRequest<unknown>[],
  responseData: unknown,
): HttpClient {
  return {
    async request<R>(request: HttpRequest<R>) {
      requests.push(request as HttpRequest<unknown>)

      return {
        data: request.decoder(responseData),
        status: 200,
      } satisfies HttpResponse<R>
    },
  }
}

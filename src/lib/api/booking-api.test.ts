import { describe, expect, it } from 'vitest'
import { localDate } from '../../../tests/local-date'
import type { BookingProfile, BookingSlotSelection } from '../../domain/booking'
import {
  addReservationToBasket,
  applyCodeToBasket,
  cancelMobilePayCheckout,
  deleteBasket,
  loadBasketPricingSummary,
  submitCheckout,
} from './booking-api'
import type { CheckoutResponseObservation } from './booking-contracts'
import type { HttpClient, HttpRequest, HttpResponse } from './client'

describe('booking-api transport mapping', () => {
  it('maps domain slot selections to storefront basket payloads', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, 249253)

    await expect(
      addReservationToBasket(client, {
        basketToken: 'fixture-basket-token',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-14'),
          endTime: '16:00',
          startTime: '15:00',
        } satisfies BookingSlotSelection,
      }),
    ).resolves.toEqual({
      itemId: '249253',
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
        paymentMethod: 'cash',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        } satisfies BookingProfile,
      }),
    ).resolves.toEqual({
      orderIdentifier: 'fixture-order-id',
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
        payment: 'cash',
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
      provider: 'mobilepay',
      redirectUrl: 'https://shop.laguuniin.fi/pay/fixture-payment-token',
      status: 'pending',
    })

    await expect(
      submitCheckout(client, {
        basketToken: 'fixture-basket-token',
        observeResponse: (observation) => {
          observations.push(observation)
        },
        paymentMethod: 'mobilepay',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        } satisfies BookingProfile,
      }),
    ).resolves.toEqual({
      orderIdentifier: '12345',
      paymentToken: null,
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

  it('treats string checkout responses as payment handoff tokens', async () => {
    const requests: HttpRequest<unknown>[] = []
    const observations: CheckoutResponseObservation[] = []
    const client = createSequentialCapturingClient(
      requests,
      'fixture-payment-token',
      'https://pay.mobilepay.fi/fixture-session',
    )

    await expect(
      submitCheckout(client, {
        basketToken: 'fixture-basket-token',
        observeResponse: (observation) => {
          observations.push(observation)
        },
        paymentMethod: 'mobilepay',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        } satisfies BookingProfile,
      }),
    ).resolves.toEqual({
      orderIdentifier: null,
      paymentToken: 'fixture-payment-token',
      redirectUrl: 'https://pay.mobilepay.fi/fixture-session',
      status: 'payment_required',
    })

    expect(observations).toEqual([
      {
        hasErrorCode: false,
        hasErrorMessage: false,
        normalizedStatus: 'ok',
        orderFieldKind: 'string',
        paymentRequiredFieldKind: 'missing',
        rawStatus: null,
        redirectUrlFieldKind: 'missing',
        responseKeys: '',
      },
    ])
    expect(requests[1]).toMatchObject({
      path: '/api/laguuni/fi_FI/rest/post/mobilepayhandler/fixture-payment-token.json',
      query: {
        domain: 'shop.laguuniin.fi',
        method: 'Create',
      },
    })
  })

  it('treats string checkout responses as success for zero-total cash checkout', async () => {
    const requests: HttpRequest<unknown>[] = []
    const cashSteps: Array<'cashreturn_completed' | 'order_details_loaded'> = []
    const client = createSequentialCapturingClient(
      requests,
      'fixture-order-id',
      {
        items: {
          identifier: 'fixture-order-id',
          payment: 'cash',
          success: true,
        },
      },
      {
        id: 'fixture-numeric-order-id',
        identifier: 'fixture-order-id',
        payment: 'cash',
        paid: '1',
        completed: '1',
      },
    )

    await expect(
      submitCheckout(client, {
        basketToken: 'fixture-basket-token',
        observeCashCheckoutStep: (step) => {
          cashSteps.push(step)
        },
        paymentMethod: 'cash',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        } satisfies BookingProfile,
      }),
    ).resolves.toEqual({
      orderIdentifier: 'fixture-order-id',
      status: 'success',
    })

    expect(requests[1]).toMatchObject({
      method: 'POST',
      path: '/api/laguuni/fi_FI/completeorderhandler/fixture-order-id/cashreturn.json',
    })
    expect(requests[2]).toMatchObject({
      path: '/api/laguuni/fi_FI/orders/fixture-order-id.json',
    })
    expect(cashSteps).toEqual(['cashreturn_completed', 'order_details_loaded'])
  })

  it('applies accepted codes through the basket items endpoint', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, null)

    await expect(
      applyCodeToBasket(client, {
        basketToken: 'fixture-basket-token',
        code: 'FIXTURE-CODE',
      }),
    ).resolves.toBeUndefined()

    expect(requests[0]).toMatchObject({
      body: {
        code: 'FIXTURE-CODE',
      },
      method: 'POST',
      path: '/api/laguuni/fi_FI/baskets/fixture-basket-token/items/new.json',
    })
  })

  it('deletes baskets through the generic basket endpoint', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, null)

    await expect(
      deleteBasket(client, 'fixture-basket-token'),
    ).resolves.toBeUndefined()

    expect(requests[0]).toMatchObject({
      method: 'DELETE',
      path: '/api/laguuni/baskets/fixture-basket-token.json',
    })
  })

  it('cancels MobilePay checkout through the completeorderhandler endpoint', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, null)

    await expect(
      cancelMobilePayCheckout(client, 'fixture-payment-token'),
    ).resolves.toBeUndefined()

    expect(requests[0]).toMatchObject({
      body: null,
      method: 'POST',
      path: '/api/laguuni/fi_FI/completeorderhandler/fixture-payment-token/mobilepayreturn.json',
    })
  })

  it('treats missing MobilePay cancel targets as already cleaned up', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createStatusCapturingClient(requests, null, 404)

    await expect(
      cancelMobilePayCheckout(client, 'fixture-payment-token'),
    ).resolves.toBeUndefined()

    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/laguuni/fi_FI/completeorderhandler/fixture-payment-token/mobilepayreturn.json',
    })
  })

  it('rejects unexpected MobilePay cancel statuses', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createStatusCapturingClient(requests, null, 500)

    await expect(
      cancelMobilePayCheckout(client, 'fixture-payment-token'),
    ).rejects.toThrow(
      'Unexpected status 500 while trying to cancel MobilePay checkout',
    )
  })

  it('treats missing baskets as already cleaned up', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createStatusCapturingClient(requests, null, 404)

    await expect(
      deleteBasket(client, 'fixture-basket-token'),
    ).resolves.toBeUndefined()

    expect(requests[0]).toMatchObject({
      method: 'DELETE',
      path: '/api/laguuni/baskets/fixture-basket-token.json',
    })
  })

  it('rejects unexpected basket delete statuses', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createStatusCapturingClient(requests, null, 500)

    await expect(deleteBasket(client, 'fixture-basket-token')).rejects.toThrow(
      'Unexpected status 500 while trying to delete basket',
    )
  })

  it('sums basket pricing using discounted prices when present', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, [
      { discountedprice: '0', price: '26' },
      { price: '5' },
    ])

    await expect(
      loadBasketPricingSummary(client, 'fixture-basket-token'),
    ).resolves.toEqual({
      totalDueCents: 500,
    })

    expect(requests[0]).toMatchObject({
      path: '/api/laguuni/fi_FI/baskets/fixture-basket-token/items.json',
      query: {
        publicreservations: true,
      },
    })
  })

  it('ignores standalone discount rows when a discounted reservation row already reflects the reduction', async () => {
    const requests: HttpRequest<unknown>[] = []
    const client = createCapturingClient(requests, [
      { discountedprice: '0', price: '26' },
      { discount_id: '2796', price: '-26' },
    ])

    await expect(
      loadBasketPricingSummary(client, 'fixture-basket-token'),
    ).resolves.toEqual({
      totalDueCents: 0,
    })

    expect(requests[0]).toMatchObject({
      path: '/api/laguuni/fi_FI/baskets/fixture-basket-token/items.json',
      query: {
        publicreservations: true,
      },
    })
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

function createStatusCapturingClient(
  requests: HttpRequest<unknown>[],
  responseData: unknown,
  status: number,
): HttpClient {
  return {
    async request<R>(request: HttpRequest<R>) {
      requests.push(request as HttpRequest<unknown>)

      return {
        data: request.decoder(responseData),
        status,
      } satisfies HttpResponse<R>
    },
  }
}

function createSequentialCapturingClient(
  requests: HttpRequest<unknown>[],
  ...responseQueue: unknown[]
): HttpClient {
  const queuedResponses = [...responseQueue]

  return {
    async request<R>(request: HttpRequest<R>) {
      requests.push(request as HttpRequest<unknown>)

      const nextResponse = queuedResponses.shift()

      if (nextResponse === undefined) {
        throw new Error(
          'No queued response was configured for this HTTP request',
        )
      }

      return {
        data: request.decoder(nextResponse),
        status: 200,
      } satisfies HttpResponse<R>
    },
  }
}

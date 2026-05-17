import { describe, expect, it } from 'vitest'

import easyAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/easy.json'
import proAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/pro.json'
import checkoutFailureFixture from '../../../tests/fixtures/laguuni/booking/checkout-failure.json'
import discountAcceptedFixture from '../../../tests/fixtures/laguuni/booking/discount-accepted.json'
import { localDate } from '../../../tests/local-date'
import type { HttpClient, HttpRequest, HttpResponse } from './client'
import { LaguuniApiClient } from './laguuni-api'

describe('LaguuniApiClient', () => {
  it('loads normalized available dates from the HTTP client layer', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient({
        data: proAvailabilityFixture.availableDates,
        status: 200,
      }),
    })
    const availableDates = await api.getAvailableDates(
      'pro',
      localDate('2026-05-03'),
    )

    expect(availableDates.map((availableDate) => availableDate.date)).toContain(
      '2026-05-08',
    )
  })

  it('loads a daily availability window from count and capacity fixtures', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient(
        { data: easyAvailabilityFixture.availableTimesCount, status: 200 },
        { data: easyAvailabilityFixture.availableTimesCapacity, status: 200 },
      ),
    })
    const availabilityWindow = await api.getDailyAvailabilityWindow(
      'easy',
      localDate('2026-05-03'),
    )

    expect(availabilityWindow).toMatchObject({
      cableId: 'easy',
      date: '2026-05-03',
    })
    expect(availabilityWindow.bookingSegments).not.toEqual([])
    expect(availabilityWindow.capacitySegments).not.toEqual([])
  })

  it('creates baskets and treats invalid code responses as invalid', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient(
        { data: 'fixture-basket-token', status: 200 },
        {
          data: {
            errorCode: 'GENERAL_ERROR',
            errorMessage: 'Antamasi koodi on virheellinen.',
            status: 'error',
          },
          status: 404,
        },
      ),
    })

    await expect(api.createBasket()).resolves.toBe('fixture-basket-token')

    await expect(
      api.lookupCode({
        code: 'INVALID',
      }),
    ).resolves.toEqual({
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Antamasi koodi on virheellinen.',
      status: 'invalid',
    })
  })

  it('recognizes accepted fixture discount responses with captured shape', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient({
        data: discountAcceptedFixture,
        status: 200,
      }),
    })

    await expect(
      api.lookupCode({
        code: 'FIXTURE-DISCOUNT',
      }),
    ).resolves.toMatchObject({
      remainingBalanceCents: null,
      source: 'discount',
      status: 'accepted',
    })
  })

  it('applies accepted codes through the client layer', async () => {
    const requests: HttpRequest<unknown>[] = []
    const api = new LaguuniApiClient({
      client: createSequentialHttpClientWithCapture(requests, {
        data: null,
        status: 200,
      }),
    })

    await expect(
      api.applyCodeToBasket({
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

  it('deletes baskets through the client layer', async () => {
    const requests: HttpRequest<unknown>[] = []
    const api = new LaguuniApiClient({
      client: createSequentialHttpClientWithCapture(requests, {
        data: null,
        status: 200,
      }),
    })

    await expect(
      api.deleteBasket('fixture-basket-token'),
    ).resolves.toBeUndefined()

    expect(requests[0]).toMatchObject({
      method: 'DELETE',
      path: '/api/laguuni/baskets/fixture-basket-token.json',
    })
  })

  it('loads basket pricing summaries from storefront basket items', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient({
        data: [{ discountedprice: '0', price: '26' }],
        status: 200,
      }),
    })

    await expect(
      api.loadBasketPricingSummary('fixture-basket-token'),
    ).resolves.toEqual({
      totalDueCents: 0,
    })
  })

  it('maps checkout submission failures without leaking flow-specific steps', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient({
        data: checkoutFailureFixture,
        status: 200,
      }),
    })

    await expect(
      api.submitCheckout({
        basketToken: 'fixture-basket-token',
        paymentMethod: 'mobilepay',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        },
      }),
    ).resolves.toEqual({
      errorCode: 'GENERAL_ERROR',
      message: 'Fixture checkout failed.',
      status: 'failed',
    })
  })
})

function createSequentialHttpClient(
  ...responses: Array<{ data: unknown; status: number }>
): HttpClient {
  const queue = [...responses]

  return {
    async request<T>({ decoder }: HttpRequest<T>) {
      const response = queue.shift()

      if (!response) {
        throw new Error(
          'No queued response was configured for this HTTP request',
        )
      }

      return {
        data: response.data === null ? null : decoder(response.data),
        status: response.status,
      } satisfies HttpResponse<T>
    },
  }
}

function createSequentialHttpClientWithCapture(
  requests: HttpRequest<unknown>[],
  ...responses: Array<{ data: unknown; status: number }>
): HttpClient {
  const queue = [...responses]

  return {
    async request<T>(request: HttpRequest<T>) {
      requests.push(request as HttpRequest<unknown>)

      const response = queue.shift()

      if (!response) {
        throw new Error(
          'No queued response was configured for this HTTP request',
        )
      }

      return {
        data: response.data === null ? null : request.decoder(response.data),
        status: response.status,
      } satisfies HttpResponse<T>
    },
  }
}

import { describe, expect, it } from 'vitest'

import hietsuAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/hietsu.json'
import proAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/pro.json'
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
    const availableDates = await api.getAvailableDates('pro', '2026-05-03')

    expect(availableDates.map((availableDate) => availableDate.date)).toContain(
      '2026-05-08',
    )
  })

  it('loads a daily availability window from count and capacity fixtures', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient(
        { data: hietsuAvailabilityFixture.availableTimesCount, status: 200 },
        { data: hietsuAvailabilityFixture.availableTimesCapacity, status: 200 },
      ),
    })
    const availabilityWindow = await api.getDailyAvailabilityWindow(
      'hietsu',
      '2026-05-03',
    )

    expect(availabilityWindow).toMatchObject({
      cableId: 'hietsu',
      date: '2026-05-03',
    })
    expect(availabilityWindow.bookingSegments).toEqual([])
    expect(availabilityWindow.capacitySegments).toEqual([])
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
        {
          data: {
            errorCode: 'GENERAL_ERROR',
            errorMessage: 'Antamasi koodi on virheellinen.',
            status: 'error',
          },
          status: 404,
        },
        {
          data: {
            errorCode: 'GENERAL_ERROR',
            status: 'error',
          },
          status: 404,
        },
      ),
    })

    await expect(api.createBasket()).resolves.toBe('fixture-basket-token')

    await expect(
      api.lookupCode({
        basketToken: 'fixture-basket-token',
        code: 'INVALID',
      }),
    ).resolves.toEqual({
      errorCode: 'GENERAL_ERROR',
      errorMessage: null,
      status: 'invalid',
    })
  })

  it('recognizes accepted fixture voucher responses', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient(
        {
          data: {
            errorCode: 'GENERAL_ERROR',
            errorMessage: 'Antamasi koodi on virheellinen.',
            status: 'error',
          },
          status: 404,
        },
        {
          data: {
            errorCode: 'GENERAL_ERROR',
            errorMessage: 'Antamasi koodi on virheellinen.',
            status: 'error',
          },
          status: 404,
        },
        {
          data: {
            code: 'FIXTURE-VOUCHER-ZERO',
            remainingValue: '0.00',
            status: 'ok',
          },
          status: 200,
        },
      ),
    })

    await expect(
      api.lookupCode({
        basketToken: 'fixture-basket-token',
        code: 'FIXTURE-VOUCHER-ZERO',
      }),
    ).resolves.toMatchObject({
      remainingBalanceCents: 0,
      source: 'voucher',
      status: 'accepted',
    })
  })

  it('maps checkout submission failures without leaking flow-specific steps', async () => {
    const api = new LaguuniApiClient({
      client: createSequentialHttpClient({
        data: {
          errorCode: 'GENERAL_ERROR',
          errorMessage: 'Fixture checkout failed.',
          status: 'error',
        },
        status: 200,
      }),
    })

    await expect(
      api.submitCheckout({
        basketToken: 'fixture-basket-token',
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

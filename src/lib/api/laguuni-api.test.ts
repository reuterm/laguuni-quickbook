import { describe, expect, it } from 'vitest'

import hietsuAvailabilityFixture from '../../../tests/fixtures/laguuni/availability/hietsu.json'
import type { HttpClient, HttpRequest, HttpResponse } from './client'
import { FetchHttpClient } from './client'
import { LaguuniApiClient } from './laguuni-api'

const availabilityApi = new LaguuniApiClient({
  client: new FetchHttpClient({
    baseUrl: 'https://shop.laguuniin.fi',
  }),
})

describe('LaguuniApiClient', () => {
  it('loads normalized available dates through the shared handlers', async () => {
    const availableDates = await availabilityApi.getAvailableDates(
      'pro',
      '2026-05-03',
    )

    expect(availableDates).toEqual(
      expect.arrayContaining([
        {
          cableId: 'pro',
          date: '2026-05-08',
          hasBookableSlots: true,
        },
      ]),
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

    expect(availabilityWindow.startTimes).toEqual(
      hietsuAvailabilityFixture.availableTimesCount.starttimes,
    )
    expect(availabilityWindow.endTimesByStartTime).toEqual(
      Array.isArray(hietsuAvailabilityFixture.availableTimesCount.endtimes)
        ? {}
        : hietsuAvailabilityFixture.availableTimesCount.endtimes,
    )
    expect(availabilityWindow.capacitySegments[1]).toEqual({
      endMinute: 780,
      freeCapacity: 0,
      startMinute: 720,
    })
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

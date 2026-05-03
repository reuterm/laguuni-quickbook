import type { CableId } from '../../domain/cable'
import { getCableById } from '../../domain/cable'
import type { AvailableDate, DailyAvailabilityWindow } from '../../domain/slot'
import type { HttpClient } from './client'
import {
  decodeAvailableDatesResponse,
  decodeAvailableTimesResponse,
  normalizeAvailableDates,
  normalizeDailyAvailabilityWindow,
} from './normalize'
import { expectResponse } from './response'

export async function getAvailableDates(
  client: HttpClient,
  cableId: CableId,
  anchorDate: string,
): Promise<readonly AvailableDate[]> {
  const productId = getCableById(cableId).productId
  const response = await client.request({
    decoder: decodeAvailableDatesResponse,
    path: `/api/laguuni/products/${productId}/availabledates/${anchorDate}.json`,
    query: {
      count: 1,
      field: 'hourlyfrom',
      mode: 'hours',
      required_resources: true,
      resource_count: 1,
    },
  })

  return normalizeAvailableDates(
    cableId,
    anchorDate,
    expectResponse(response, [200], 'load available dates'),
  )
}

export async function getDailyAvailabilityWindow(
  client: HttpClient,
  cableId: CableId,
  date: string,
): Promise<DailyAvailabilityWindow> {
  const productId = getCableById(cableId).productId
  const [countResponse, capacityResponse] = await Promise.all([
    client.request({
      decoder: decodeAvailableTimesResponse,
      path: `/api/laguuni/fi_FI/products/${productId}/availabletimes/${date}.json`,
      query: {
        count: 1,
      },
    }),
    client.request({
      decoder: decodeAvailableTimesResponse,
      path: `/api/laguuni/fi_FI/products/${productId}/availabletimes/${date}.json`,
      query: {
        capacity: true,
      },
    }),
  ])

  return normalizeDailyAvailabilityWindow(
    cableId,
    date,
    expectResponse(countResponse, [200], 'load availability times'),
    expectResponse(capacityResponse, [200], 'load availability capacities'),
  )
}

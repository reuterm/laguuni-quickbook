import type {
  AcceptedCodePayload,
  BasketToken,
  BookingProfile,
  BookingResult,
  BookingSelection,
  CodeLookupPayload,
  CodeLookupResult,
  InvalidCodePayload,
} from '../../domain/booking'
import type { CableId } from '../../domain/cable'
import { getCableById } from '../../domain/cable'
import type { AvailableDate, DailyAvailabilityWindow } from '../../domain/slot'
import { isRecord } from '../type-guards'
import type { HttpClient, HttpResponse } from './client'
import {
  decodeAvailableDatesResponse,
  decodeAvailableTimesResponse,
  normalizeAvailableDates,
  normalizeDailyAvailabilityWindow,
} from './normalize'

type AddReservationResponse = {
  basket: string
  itemId: string
  status: 'ok'
}

type CheckoutResponse =
  | {
      errorCode?: string | undefined
      errorMessage?: string | undefined
      status: 'error'
    }
  | {
      order?: string | undefined
      paymentRequired?: boolean | undefined
      redirectUrl?: string | null | undefined
      status: 'ok'
    }

type LookupCodeArgs = {
  basketToken: BasketToken
  code: string
}

type AddReservationArgs = {
  basketToken: BasketToken
  selection: BookingSelection
}

type SubmitCheckoutArgs = {
  basketToken: BasketToken
  profile: BookingProfile
}

export type LaguuniApi = {
  addReservationToBasket(
    args: AddReservationArgs,
  ): Promise<AddReservationResponse>
  createBasket(): Promise<BasketToken>
  getAvailableDates(
    cableId: CableId,
    anchorDate: string,
  ): Promise<readonly AvailableDate[]>
  getDailyAvailabilityWindow(
    cableId: CableId,
    date: string,
  ): Promise<DailyAvailabilityWindow>
  lookupCode(args: LookupCodeArgs): Promise<CodeLookupResult>
  submitCheckout(args: SubmitCheckoutArgs): Promise<BookingResult>
}

export type LaguuniApiClientOptions = {
  client: HttpClient
}

export class LaguuniApiClient implements LaguuniApi {
  readonly #client: HttpClient

  constructor({ client }: LaguuniApiClientOptions) {
    this.#client = client
  }

  async addReservationToBasket({
    basketToken,
    selection,
  }: AddReservationArgs): Promise<AddReservationResponse> {
    const response = await this.#client.request({
      body: {
        count: selection.count,
        product_id: selection.productId,
        reservation_count: selection.reservationCount,
        reservation_datestart: selection.date,
        reservation_timeend: selection.endTime,
        reservation_timestart: selection.startTime,
        resource_count: selection.resourceCount,
        version: 'fi_FI',
      },
      decoder: decodeAddReservationResponse,
      method: 'POST',
      path: `/api/laguuni/fi_FI/baskets/${basketToken}/items/new.json`,
    })

    return expectResponse(response, [200, 201], 'add reservation')
  }

  async createBasket(): Promise<BasketToken> {
    const response = await this.#client.request({
      decoder: decodeBasketToken,
      path: '/api/laguuni/baskets.json',
    })

    return expectResponse(response, [200], 'create basket')
  }

  async getAvailableDates(
    cableId: CableId,
    anchorDate: string,
  ): Promise<readonly AvailableDate[]> {
    const productId = getCableById(cableId).productId
    const response = await this.#client.request({
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

  async getDailyAvailabilityWindow(
    cableId: CableId,
    date: string,
  ): Promise<DailyAvailabilityWindow> {
    const productId = getCableById(cableId).productId
    const [countResponse, capacityResponse] = await Promise.all([
      this.#client.request({
        decoder: decodeAvailableTimesResponse,
        path: `/api/laguuni/fi_FI/products/${productId}/availabletimes/${date}.json`,
        query: {
          count: 1,
        },
      }),
      this.#client.request({
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

  async lookupCode({
    basketToken,
    code,
  }: LookupCodeArgs): Promise<CodeLookupResult> {
    const valueCardResponse = await this.#client.request({
      decoder: decodeCodeLookupPayload,
      path: `/api/laguuni/valuecards/${code}/public.json`,
    })

    if (valueCardResponse.status === 200) {
      const payload = expectAcceptedCodePayload(
        valueCardResponse,
        'load value card',
      )

      return {
        payload,
        remainingBalanceCents: readRemainingBalanceCents(payload),
        source: 'valuecard',
        status: 'accepted',
      }
    }

    const discountResponse = await this.#client.request({
      decoder: decodeCodeLookupPayload,
      path: `/api/laguuni/discounts/${code}/public.json`,
    })

    if (discountResponse.status === 200) {
      const payload = expectAcceptedCodePayload(
        discountResponse,
        'load discount',
      )

      return {
        payload,
        remainingBalanceCents: readRemainingBalanceCents(payload),
        source: 'discount',
        status: 'accepted',
      }
    }

    const voucherResponse = await this.#client.request({
      decoder: decodeCodeLookupPayload,
      path: `/api/laguuni/vouchers/${code}.json`,
      query: {
        action: 'check',
        basket: basketToken,
      },
    })

    if (voucherResponse.status === 200) {
      const payload = expectAcceptedCodePayload(voucherResponse, 'load voucher')

      return {
        payload,
        remainingBalanceCents: readRemainingBalanceCents(payload),
        source: 'voucher',
        status: 'accepted',
      }
    }

    if (
      valueCardResponse.status === 404 &&
      discountResponse.status === 404 &&
      voucherResponse.status === 404
    ) {
      const payload = expectInvalidCodePayload(
        voucherResponse,
        'read invalid voucher response',
      )

      return {
        errorCode: readErrorCode(payload),
        status: 'invalid',
      }
    }

    throw new Error(
      `Unexpected status codes while validating code "${code}": ${valueCardResponse.status}, ${discountResponse.status}, ${voucherResponse.status}`,
    )
  }

  async submitCheckout({
    basketToken,
    profile,
  }: SubmitCheckoutArgs): Promise<BookingResult> {
    const response = await this.#client.request({
      body: {
        allowmarketing: 0,
        consolidated: 0,
        country: null,
        deliveryRules: [],
        email: profile.email,
        master: 1,
        more: null,
        name: profile.name,
        payment: profile.paymentMethod,
        phone: profile.phone,
        terms_accepted: profile.termsAccepted ? 1 : 0,
        version: 'fi_FI',
      },
      decoder: decodeCheckoutResponse,
      method: 'POST',
      path: `/api/laguuni/fi_FI/orders/${basketToken}.json`,
    })

    const checkout = expectResponse(response, [200], 'submit checkout')

    if (checkout.status === 'error') {
      return {
        reason: checkout.errorCode ?? checkout.errorMessage ?? 'checkout-error',
        status: 'failed',
      }
    }

    if (checkout.paymentRequired) {
      return {
        orderId: checkout.order ?? null,
        redirectUrl: checkout.redirectUrl ?? null,
        status: 'payment_required',
      }
    }

    return {
      orderId: checkout.order ?? null,
      status: 'success',
    }
  }
}

function expectResponse<T>(
  response: HttpResponse<T>,
  expectedStatuses: readonly number[],
  operation: string,
): T {
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `Unexpected status ${response.status} while trying to ${operation}`,
    )
  }

  if (response.data === null) {
    throw new Error(
      `The Laguuni API returned an empty response for ${operation}`,
    )
  }

  return response.data
}

function expectAcceptedCodePayload(
  response: HttpResponse<CodeLookupPayload>,
  operation: string,
): AcceptedCodePayload {
  const payload = expectResponse(response, [200], operation)

  if (payload.status !== 'ok') {
    throw new Error(
      `Expected an accepted code payload while trying to ${operation}`,
    )
  }

  return payload
}

function expectInvalidCodePayload(
  response: HttpResponse<CodeLookupPayload>,
  operation: string,
): InvalidCodePayload {
  const payload = expectResponse(response, [404], operation)

  if (payload.status !== 'error') {
    throw new Error(
      `Expected an invalid code payload while trying to ${operation}`,
    )
  }

  return payload
}

function readErrorCode(payload: InvalidCodePayload): string | null {
  return payload.errorCode ?? null
}

function readRemainingBalanceCents(
  payload: AcceptedCodePayload,
): number | null {
  for (const value of [
    payload.remainingBalanceCents,
    payload.remainingValue,
    payload.balance,
  ]) {
    if (typeof value === 'number') {
      return Math.round(value * 100)
    }

    if (typeof value === 'string') {
      const parsedValue = Number.parseFloat(value)

      if (!Number.isNaN(parsedValue)) {
        return Math.round(parsedValue * 100)
      }
    }
  }

  return null
}

function decodeBasketToken(value: unknown): BasketToken {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      'Basket bootstrap response must be a non-empty token string',
    )
  }

  return value
}

function decodeAddReservationResponse(value: unknown): AddReservationResponse {
  if (!isRecord(value)) {
    throw new Error('Add-to-basket response must be an object')
  }

  const basket = readRequiredString(value, 'basket')
  const itemId = readRequiredString(value, 'itemId')
  const status = readRequiredString(value, 'status')

  if (status !== 'ok') {
    throw new Error('Add-to-basket response must have status "ok"')
  }

  return {
    basket,
    itemId,
    status,
  }
}

function decodeCodeLookupPayload(value: unknown): CodeLookupPayload {
  if (!isRecord(value)) {
    throw new Error('Code lookup response must be an object')
  }

  const status = readRequiredString(value, 'status')

  if (status === 'ok') {
    return {
      amount: readOptionalString(value, 'amount'),
      balance: readOptionalNumberOrString(value, 'balance'),
      code: readOptionalString(value, 'code'),
      remainingBalanceCents: readOptionalNumberOrString(
        value,
        'remainingBalanceCents',
      ),
      remainingValue: readOptionalString(value, 'remainingValue'),
      status,
    }
  }

  if (status === 'error') {
    return {
      errorCode: readOptionalString(value, 'errorCode'),
      errorMessage: readOptionalString(value, 'errorMessage'),
      status,
    }
  }

  throw new Error('Code lookup response must have status "ok" or "error"')
}

function decodeCheckoutResponse(value: unknown): CheckoutResponse {
  if (!isRecord(value)) {
    throw new Error('Checkout response must be an object')
  }

  const status = readRequiredString(value, 'status')

  if (status === 'error') {
    return {
      errorCode: readOptionalString(value, 'errorCode'),
      errorMessage: readOptionalString(value, 'errorMessage'),
      status,
    }
  }

  if (status === 'ok') {
    return {
      order: readOptionalString(value, 'order'),
      paymentRequired: readOptionalBoolean(value, 'paymentRequired'),
      redirectUrl: readOptionalNullableString(value, 'redirectUrl'),
      status,
    }
  }

  throw new Error('Checkout response must have status "ok" or "error"')
}

function readRequiredString(
  value: Record<string, unknown>,
  key: string,
): string {
  const field = value[key]

  if (typeof field !== 'string') {
    throw new Error(`Expected "${key}" to be a string`)
  }

  return field
}

function readOptionalString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const field = value[key]

  if (field === undefined) {
    return undefined
  }

  if (typeof field !== 'string') {
    throw new Error(`Expected "${key}" to be a string when present`)
  }

  return field
}

function readOptionalNullableString(
  value: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const field = value[key]

  if (field === undefined || field === null) {
    return field
  }

  if (typeof field !== 'string') {
    throw new Error(`Expected "${key}" to be a string or null when present`)
  }

  return field
}

function readOptionalBoolean(
  value: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const field = value[key]

  if (field === undefined) {
    return undefined
  }

  if (typeof field !== 'boolean') {
    throw new Error(`Expected "${key}" to be a boolean when present`)
  }

  return field
}

function readOptionalNumberOrString(
  value: Record<string, unknown>,
  key: string,
): number | string | undefined {
  const field = value[key]

  if (field === undefined) {
    return undefined
  }

  if (typeof field !== 'number' && typeof field !== 'string') {
    throw new Error(`Expected "${key}" to be a number or string when present`)
  }

  return field
}

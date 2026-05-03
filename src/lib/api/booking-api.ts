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
import { isRecord } from '../type-guards'
import type { HttpClient, HttpResponse } from './client'
import { expectResponse } from './response'

export type AddReservationResponse = {
  basket: string
  itemId: string
  status: 'ok'
}

export type LookupCodeArgs = {
  basketToken: BasketToken
  code: string
}

export type AddReservationArgs = {
  basketToken: BasketToken
  selection: BookingSelection
}

export type SubmitCheckoutArgs = {
  basketToken: BasketToken
  profile: BookingProfile
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

export async function addReservationToBasket(
  client: HttpClient,
  { basketToken, selection }: AddReservationArgs,
): Promise<AddReservationResponse> {
  const response = await client.request({
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

export async function createBasket(client: HttpClient): Promise<BasketToken> {
  const response = await client.request({
    decoder: decodeBasketToken,
    path: '/api/laguuni/baskets.json',
  })

  return expectResponse(response, [200], 'create basket')
}

export async function lookupCode(
  client: HttpClient,
  { basketToken, code }: LookupCodeArgs,
): Promise<CodeLookupResult> {
  const valueCardResponse = await client.request({
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

  const discountResponse = await client.request({
    decoder: decodeCodeLookupPayload,
    path: `/api/laguuni/discounts/${code}/public.json`,
  })

  if (discountResponse.status === 200) {
    const payload = expectAcceptedCodePayload(discountResponse, 'load discount')

    return {
      payload,
      remainingBalanceCents: readRemainingBalanceCents(payload),
      source: 'discount',
      status: 'accepted',
    }
  }

  const voucherResponse = await client.request({
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

export async function submitCheckout(
  client: HttpClient,
  { basketToken, profile }: SubmitCheckoutArgs,
): Promise<BookingResult> {
  const response = await client.request({
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

import type {
  BookingCheckoutResult,
  BookingCodeSource,
  BookingCodeValidationResult,
} from '../../domain/booking'
import { isRecord } from '../type-guards'
import type { AddReservationResponse } from './booking-contracts'
import type { HttpResponse } from './client'
import { expectResponse } from './response'
import type {
  AcceptedCodePayload,
  BasketToken,
  CodeLookupPayload,
  InvalidCodePayload,
} from './storefront-booking'

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

export function createAcceptedCodeLookupResult(
  payload: AcceptedCodePayload,
  source: BookingCodeSource,
): Extract<BookingCodeValidationResult, { status: 'accepted' }> {
  return {
    remainingBalanceCents: readRemainingBalanceCents(payload),
    source,
    status: 'accepted',
  }
}

export function createInvalidCodeLookupResult(
  payload: InvalidCodePayload,
): Extract<BookingCodeValidationResult, { status: 'invalid' }> {
  return {
    errorCode: payload.errorCode ?? null,
    errorMessage: payload.errorMessage ?? null,
    status: 'invalid',
  }
}

export function decodeBasketToken(value: unknown): BasketToken {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      'Basket bootstrap response must be a non-empty token string',
    )
  }

  return value
}

export function decodeAddReservationResponse(
  value: unknown,
): AddReservationResponse {
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

export function decodeCodeLookupPayload(value: unknown): CodeLookupPayload {
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

export function decodeCheckoutResponse(value: unknown): CheckoutResponse {
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

export function expectAcceptedCodePayload(
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

export function expectInvalidCodePayload(
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

export function mapCheckoutResponseToResult(
  checkout: CheckoutResponse,
): BookingCheckoutResult {
  if (checkout.status === 'error') {
    return {
      errorCode: checkout.errorCode ?? null,
      message:
        checkout.errorMessage ?? checkout.errorCode ?? 'Checkout failed.',
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

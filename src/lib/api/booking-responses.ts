import type {
  BookingCheckoutResult,
  BookingCodeSource,
  BookingCodeValidationResult,
} from '../../domain/booking'
import { isRecord } from '../type-guards'
import type {
  AddReservationResponse,
  CheckoutResponseFieldKind,
  CheckoutResponseObservation,
} from './booking-contracts'
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
      observation: CheckoutResponseObservation
      status: 'error'
    }
  | {
      order?: string | undefined
      observation: CheckoutResponseObservation
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
  if (typeof value === 'string' || typeof value === 'number') {
    return {
      itemId: normalizeRequiredIdentifier(value, 'add-to-basket item id'),
    }
  }

  if (!isRecord(value)) {
    throw new Error(
      'Add-to-basket response must be an item identifier or an object with itemId',
    )
  }

  return {
    itemId: readRequiredIdentifier(value, 'itemId'),
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

  // Temporary: keep checkout decoding permissive until we capture the exact
  // live submit response shape for both zero-total and payment-required flows.
  const observation = createCheckoutResponseObservation(value)
  const isErrorResponse =
    observation.rawStatus === 'error' ||
    hasStringLikeValue(value.errorCode) ||
    hasStringLikeValue(value.errorMessage)

  if (isErrorResponse) {
    return {
      errorCode: readOptionalStringLike(value, 'errorCode'),
      errorMessage: readOptionalStringLike(value, 'errorMessage'),
      observation,
      status: 'error',
    }
  }

  return {
    observation,
    order: readOptionalIdentifier(value, ['order', 'orderId']),
    paymentRequired: readOptionalBooleanLike(value, 'paymentRequired'),
    redirectUrl: readOptionalNullableStringLike(value, 'redirectUrl'),
    status: 'ok',
  }
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

  if (
    checkout.paymentRequired ||
    (checkout.redirectUrl !== null && checkout.redirectUrl !== undefined)
  ) {
    // Temporary: treat any redirect URL as a payment handoff until the exact
    // storefront success contract is captured from a real checkout response.
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

function readOptionalStringLike(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const field = value[key]

  if (field === undefined || field === null) {
    return undefined
  }

  if (typeof field === 'string') {
    return field
  }

  if (typeof field === 'number' && Number.isFinite(field)) {
    return String(field)
  }

  return undefined
}

function readOptionalNullableStringLike(
  value: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const field = value[key]

  if (field === undefined || field === null) {
    return field
  }

  if (typeof field === 'string') {
    return field
  }

  if (typeof field === 'number' && Number.isFinite(field)) {
    return String(field)
  }

  return undefined
}

function readOptionalBooleanLike(
  value: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const field = value[key]

  if (field === undefined) {
    return undefined
  }

  if (typeof field === 'boolean') {
    return field
  }

  if (typeof field === 'number') {
    if (field === 1) {
      return true
    }

    if (field === 0) {
      return false
    }
  }

  if (typeof field === 'string') {
    if (field === 'true' || field === '1') {
      return true
    }

    if (field === 'false' || field === '0') {
      return false
    }
  }

  return undefined
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

function readRequiredIdentifier(
  value: Record<string, unknown>,
  key: string,
): string {
  return normalizeRequiredIdentifier(value[key], key)
}

function readOptionalIdentifier(
  value: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const field = value[key]

    if (field === undefined || field === null) {
      continue
    }

    if (
      (typeof field === 'number' && Number.isFinite(field)) ||
      (typeof field === 'string' && field.length > 0)
    ) {
      return normalizeRequiredIdentifier(field, key)
    }
  }

  return undefined
}

function normalizeRequiredIdentifier(value: unknown, key: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  throw new Error(`Expected "${key}" to be a non-empty string or number`)
}

function createCheckoutResponseObservation(
  value: Record<string, unknown>,
): CheckoutResponseObservation {
  return {
    hasErrorCode: hasStringLikeValue(value.errorCode),
    hasErrorMessage: hasStringLikeValue(value.errorMessage),
    normalizedStatus:
      readOptionalStringLike(value, 'status') === 'error' ||
      hasStringLikeValue(value.errorCode) ||
      hasStringLikeValue(value.errorMessage)
        ? 'error'
        : 'ok',
    orderFieldKind: describeFieldKind(
      firstDefinedValue(value, ['order', 'orderId']),
    ),
    paymentRequiredFieldKind: describeFieldKind(value.paymentRequired),
    rawStatus: readOptionalStringLike(value, 'status') ?? null,
    redirectUrlFieldKind: describeFieldKind(value.redirectUrl),
    responseKeys: Object.keys(value).sort().join(','),
  }
}

function firstDefinedValue(
  value: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    if (value[key] !== undefined) {
      return value[key]
    }
  }

  return undefined
}

function describeFieldKind(value: unknown): CheckoutResponseFieldKind {
  if (value === undefined) {
    return 'missing'
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return 'string'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  if (typeof value === 'boolean') {
    return 'boolean'
  }

  return 'other'
}

function hasStringLikeValue(value: unknown): boolean {
  return (
    (typeof value === 'string' && value.length > 0) ||
    (typeof value === 'number' && Number.isFinite(value))
  )
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

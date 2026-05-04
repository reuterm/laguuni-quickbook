import type {
  BookingCheckoutResult,
  BookingCodeValidationResult,
} from '../../domain/booking'
import type {
  AddReservationArgs,
  AddReservationResponse,
  LookupCodeArgs,
  SubmitCheckoutArgs,
} from './booking-contracts'
import {
  createAddReservationRequestBody,
  createCheckoutRequestBody,
} from './booking-payloads'
import {
  createAcceptedCodeLookupResult,
  createInvalidCodeLookupResult,
  decodeAddReservationResponse,
  decodeBasketToken,
  decodeCheckoutResponse,
  decodeCodeLookupPayload,
  expectAcceptedCodePayload,
  expectInvalidCodePayload,
  mapCheckoutResponseToResult,
} from './booking-responses'
import type { HttpClient } from './client'
import { expectResponse } from './response'
import type { BasketToken } from './storefront-booking'

export type {
  AddReservationArgs,
  AddReservationResponse,
  LookupCodeArgs,
  SubmitCheckoutArgs,
} from './booking-contracts'

export async function addReservationToBasket(
  client: HttpClient,
  { basketToken, selection }: AddReservationArgs,
): Promise<AddReservationResponse> {
  const response = await client.request({
    body: createAddReservationRequestBody(selection),
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
): Promise<BookingCodeValidationResult> {
  const valueCardResponse = await client.request({
    decoder: decodeCodeLookupPayload,
    path: `/api/laguuni/valuecards/${code}/public.json`,
  })

  if (valueCardResponse.status === 200) {
    return createAcceptedCodeLookupResult(
      expectAcceptedCodePayload(valueCardResponse, 'load value card'),
      'valuecard',
    )
  }

  const discountResponse = await client.request({
    decoder: decodeCodeLookupPayload,
    path: `/api/laguuni/discounts/${code}/public.json`,
  })

  if (discountResponse.status === 200) {
    return createAcceptedCodeLookupResult(
      expectAcceptedCodePayload(discountResponse, 'load discount'),
      'discount',
    )
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
    return createAcceptedCodeLookupResult(
      expectAcceptedCodePayload(voucherResponse, 'load voucher'),
      'voucher',
    )
  }

  if (
    valueCardResponse.status === 404 &&
    discountResponse.status === 404 &&
    voucherResponse.status === 404
  ) {
    return createInvalidCodeLookupResult(
      expectInvalidCodePayload(
        voucherResponse,
        'read invalid voucher response',
      ),
    )
  }

  throw new Error(
    `Unexpected status codes while validating code "${code}": ${valueCardResponse.status}, ${discountResponse.status}, ${voucherResponse.status}`,
  )
}

export async function submitCheckout(
  client: HttpClient,
  { basketToken, observeResponse, profile }: SubmitCheckoutArgs,
): Promise<BookingCheckoutResult> {
  const response = await client.request({
    body: createCheckoutRequestBody(profile),
    decoder: decodeCheckoutResponse,
    method: 'POST',
    path: `/api/laguuni/fi_FI/orders/${basketToken}.json`,
  })

  const checkoutResponse = expectResponse(response, [200], 'submit checkout')

  // Temporary: record only a safe response-shape summary during live tests
  // while the exact checkout response contract is still being discovered.
  observeResponse?.(checkoutResponse.observation)

  return mapCheckoutResponseToResult(checkoutResponse)
}

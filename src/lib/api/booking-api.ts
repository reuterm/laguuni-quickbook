import type {
  BookingCheckoutResult,
  BookingCodeValidationResult,
} from '../../domain/booking'
import type {
  AddReservationArgs,
  AddReservationResponse,
  ApplyCodeArgs,
  BasketPricingSummary,
  LookupCodeArgs,
  SubmitCheckoutArgs,
} from './booking-contracts'
import {
  createAddReservationRequestBody,
  createApplyCodeRequestBody,
  createCheckoutRequestBody,
} from './booking-payloads'
import {
  createAcceptedCodeLookupResult,
  createInvalidCodeLookupResult,
  decodeAddReservationResponse,
  decodeBasketPricingSummary,
  decodeBasketToken,
  decodeCheckoutResponse,
  decodeCodeLookupPayload,
  decodeCompletedCashCheckoutResponse,
  decodeCompletedOrderDetailsResponse,
  decodePaymentRedirectResponse,
  expectAcceptedCodePayload,
  expectInvalidCodePayload,
  hasCheckoutPaymentToken,
  mapCheckoutResponseToResult,
} from './booking-responses'
import type { HttpClient } from './client'
import { expectResponse } from './response'
import type { BasketToken } from './storefront-booking'

export type {
  AddReservationArgs,
  AddReservationResponse,
  ApplyCodeArgs,
  BasketPricingSummary,
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

export async function applyCodeToBasket(
  client: HttpClient,
  { basketToken, code }: ApplyCodeArgs,
): Promise<void> {
  const response = await client.request({
    body: createApplyCodeRequestBody(code),
    decoder: () => null,
    method: 'POST',
    path: `/api/laguuni/fi_FI/baskets/${basketToken}/items/new.json`,
  })

  if (![200, 201].includes(response.status)) {
    throw new Error(
      `Unexpected status ${response.status} while trying to apply code`,
    )
  }
}

export async function loadBasketPricingSummary(
  client: HttpClient,
  basketToken: BasketToken,
): Promise<BasketPricingSummary> {
  const response = await client.request({
    decoder: decodeBasketPricingSummary,
    path: `/api/laguuni/fi_FI/baskets/${basketToken}/items.json`,
    query: {
      publicreservations: true,
    },
  })

  return expectResponse(response, [200], 'load basket pricing summary')
}

export async function lookupCode(
  client: HttpClient,
  { code }: LookupCodeArgs,
): Promise<BookingCodeValidationResult> {
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

  if (discountResponse.status === 404) {
    return createInvalidCodeLookupResult(
      expectInvalidCodePayload(
        discountResponse,
        'read invalid discount response',
      ),
    )
  }

  throw new Error(
    `Unexpected status code while validating discount code "${code}": ${discountResponse.status}`,
  )
}

export async function submitCheckout(
  client: HttpClient,
  {
    basketToken,
    observeCashCheckoutStep,
    observePaymentRedirect,
    observeResponse,
    paymentMethod,
    profile,
  }: SubmitCheckoutArgs,
): Promise<BookingCheckoutResult> {
  const response = await client.request({
    body: createCheckoutRequestBody(profile, paymentMethod),
    decoder: decodeCheckoutResponse,
    method: 'POST',
    path: `/api/laguuni/fi_FI/orders/${basketToken}.json`,
  })

  const checkoutResponse = expectResponse(response, [200], 'submit checkout')

  // Temporary: record only a safe response-shape summary during live tests
  // while the exact checkout response contract is still being discovered.
  observeResponse?.(checkoutResponse.observation)

  if (hasCheckoutPaymentToken(checkoutResponse)) {
    if (paymentMethod === 'cash') {
      return completeCashCheckout(
        client,
        checkoutResponse.paymentToken,
        observeCashCheckoutStep,
      )
    }

    const paymentRedirectResponse = await client.request({
      decoder: decodePaymentRedirectResponse,
      path: `/api/laguuni/fi_FI/rest/post/mobilepayhandler/${checkoutResponse.paymentToken}.json`,
      query: {
        domain: 'shop.laguuniin.fi',
        method: 'Create',
      },
    })
    const paymentRedirect = expectResponse(
      paymentRedirectResponse,
      [200],
      'create MobilePay payment redirect',
    )

    observePaymentRedirect?.(paymentRedirect.redirectUrl)

    return {
      orderIdentifier: null,
      redirectUrl: paymentRedirect.redirectUrl,
      status: 'payment_required',
    }
  }

  return mapCheckoutResponseToResult(checkoutResponse)
}

async function completeCashCheckout(
  client: HttpClient,
  orderIdentifier: string,
  observeCashCheckoutStep?: (
    step: 'cashreturn_completed' | 'order_details_loaded',
  ) => void,
): Promise<BookingCheckoutResult> {
  const completionResponse = await client.request({
    decoder: decodeCompletedCashCheckoutResponse,
    method: 'POST',
    path: `/api/laguuni/fi_FI/completeorderhandler/${orderIdentifier}/cashreturn.json`,
  })

  const completion = expectResponse(
    completionResponse,
    [200],
    'complete zero-total checkout',
  )

  if (completion.identifier !== orderIdentifier) {
    throw new Error(
      'Completed cash checkout response returned a different identifier',
    )
  }

  observeCashCheckoutStep?.('cashreturn_completed')

  const orderDetailsResponse = await client.request({
    decoder: decodeCompletedOrderDetailsResponse,
    path: `/api/laguuni/fi_FI/orders/${orderIdentifier}.json`,
  })

  const orderDetails = expectResponse(
    orderDetailsResponse,
    [200],
    'load completed order details',
  )

  if (orderDetails.identifier !== orderIdentifier) {
    throw new Error('Completed order details returned a different identifier')
  }

  observeCashCheckoutStep?.('order_details_loaded')

  return {
    orderIdentifier,
    status: 'success',
  }
}

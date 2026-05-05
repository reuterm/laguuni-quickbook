import { HttpResponse, http } from 'msw'
import {
  DEFAULT_LAGUUNI_API_BASE_URL,
  normalizeApiBaseUrl,
} from '../../../src/lib/api/client'
import easyAvailabilityFixture from '../../fixtures/laguuni/availability/easy.json'
import hietsuAvailabilityFixture from '../../fixtures/laguuni/availability/hietsu.json'
import proAvailabilityFixture from '../../fixtures/laguuni/availability/pro.json'
import addToBasketFixture from '../../fixtures/laguuni/booking/add-to-basket-success.json'
import basketFixture from '../../fixtures/laguuni/booking/basket.json'
import checkoutFailureFixture from '../../fixtures/laguuni/booking/checkout-failure.json'
import checkoutPaymentRequiredFixture from '../../fixtures/laguuni/booking/checkout-payment-required.json'
import checkoutSuccessFixture from '../../fixtures/laguuni/booking/checkout-success.json'
import completeOrderCashreturnFixture from '../../fixtures/laguuni/booking/complete-order-cashreturn.json'
import discountAcceptedFixture from '../../fixtures/laguuni/booking/discount-accepted.json'
import discountInvalidFixture from '../../fixtures/laguuni/booking/discount-invalid.json'
import orderSuccessDetailsFixture from '../../fixtures/laguuni/booking/order-success-details.json'

const availabilityFixtureByProductId = {
  '157': hietsuAvailabilityFixture,
  '6': proAvailabilityFixture,
  '7': easyAvailabilityFixture,
}

const TEST_API_BASE_URL = normalizeApiBaseUrl(
  process.env.LAGUUNI_API_BASE_URL ?? DEFAULT_LAGUUNI_API_BASE_URL,
)

const basketStateByToken = new Map<string, BasketState>()

const MOBILEPAY_HANDLER_REDIRECT = {
  redirectUrl:
    'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
}

export const laguuniHandlers = [
  http.get(`${TEST_API_BASE_URL}/api/laguuni/baskets.json`, () =>
    HttpResponse.json(basketFixture),
  ),

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/products/:productId/availabledates/:anchorDate.json`,
    ({ params, request }) => {
      const productId = String(params.productId)
      const fixture =
        availabilityFixtureByProductId[
          productId as keyof typeof availabilityFixtureByProductId
        ]

      if (!fixture) {
        return HttpResponse.json(
          { errorCode: 'UNKNOWN_PRODUCT', status: 'error' },
          { status: 404 },
        )
      }

      const url = new URL(request.url)

      if (
        !matchesSearchParams(url, {
          count: '1',
          field: 'hourlyfrom',
          mode: 'hours',
          required_resources: 'true',
          resource_count: '1',
        })
      ) {
        return invalidQueryResponse('available dates')
      }

      return HttpResponse.json(fixture.availableDates)
    },
  ),

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/products/:productId/availabletimes/:date.json`,
    ({ params, request }) => {
      const productId = String(params.productId)
      const fixture =
        availabilityFixtureByProductId[
          productId as keyof typeof availabilityFixtureByProductId
        ]

      if (!fixture) {
        return HttpResponse.json(
          { errorCode: 'UNKNOWN_PRODUCT', status: 'error' },
          { status: 404 },
        )
      }

      const url = new URL(request.url)

      if (url.searchParams.get('capacity') === 'true') {
        return HttpResponse.json(fixture.availableTimesCapacity)
      }

      if (url.searchParams.get('count') !== '1') {
        return invalidQueryResponse('availability times')
      }

      return HttpResponse.json(fixture.availableTimesCount)
    },
  ),

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/discounts/:code/public.json`,
    ({ params }) => {
      const code = String(params.code)

      if (code === 'FIXTURE-DISCOUNT') {
        return HttpResponse.json(discountAcceptedFixture)
      }

      return HttpResponse.json(discountInvalidFixture, { status: 404 })
    },
  ),

  http.post(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items/new.json`,
    async ({ params, request }) => {
      const basketToken = String(params.basketToken)
      const body = await readRequestBody(request)

      if (isValidApplyCodeBody(body)) {
        const basketState = getBasketState(basketToken)
        basketState.hasZeroTotalCode = hasExpectedCode(body, 'FIXTURE-DISCOUNT')
        return HttpResponse.json(null)
      }

      if (!isValidAddToBasketBody(body)) {
        return invalidRequestBodyResponse('add reservation')
      }

      getBasketState(basketToken).hasReservation = true

      return HttpResponse.json(addToBasketFixture)
    },
  ),

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items.json`,
    ({ params, request }) => {
      const url = new URL(request.url)

      if (url.searchParams.get('publicreservations') !== 'true') {
        return invalidQueryResponse('basket items')
      }

      const basketState = getBasketState(String(params.basketToken))

      if (!basketState.hasReservation) {
        return HttpResponse.json([])
      }

      if (basketState.checkoutCompleted) {
        return HttpResponse.json([])
      }

      return HttpResponse.json([
        {
          discountedprice: basketState.hasZeroTotalCode ? '0' : null,
          price: '26',
        },
      ])
    },
  ),

  http.post(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
    async ({ params, request }) => {
      const basketToken = String(params.basketToken)
      const body = await readRequestBody(request)

      if (!isValidCheckoutBody(body)) {
        return invalidRequestBodyResponse('submit checkout')
      }

      const basketState = getBasketState(basketToken)
      basketState.checkoutCompleted = true

      if (basketToken === 'fixture-basket-payment') {
        return HttpResponse.json(checkoutPaymentRequiredFixture)
      }

      if (basketToken === 'fixture-basket-failure') {
        return HttpResponse.json(checkoutFailureFixture)
      }

      if (isRecord(body) && body.payment === 'cash') {
        return HttpResponse.json(checkoutSuccessFixture)
      }

      return HttpResponse.json(checkoutPaymentRequiredFixture)
    },
  ),

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
    ({ request }) => {
      const url = new URL(request.url)

      if (
        url.searchParams.get('method') !== 'Create' ||
        url.searchParams.get('domain') !== 'shop.laguuniin.fi'
      ) {
        return invalidQueryResponse('mobilepay handler')
      }

      return HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT)
    },
  ),

  http.post(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/completeorderhandler/:identifier/cashreturn.json`,
    ({ params }) =>
      HttpResponse.json({
        items: {
          ...completeOrderCashreturnFixture.items,
          identifier: String(params.identifier),
        },
      }),
  ),

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:identifier.json`,
    ({ params }) =>
      HttpResponse.json({
        ...orderSuccessDetailsFixture,
        identifier: String(params.identifier),
      }),
  ),
]

type BasketState = {
  checkoutCompleted: boolean
  hasZeroTotalCode: boolean
  hasReservation: boolean
}

export function resetLaguuniHandlerState() {
  basketStateByToken.clear()
}

function matchesSearchParams(
  url: URL,
  expectedParams: Record<string, string>,
): boolean {
  return Object.entries(expectedParams).every(
    ([key, value]) => url.searchParams.get(key) === value,
  )
}

function getBasketState(basketToken: string): BasketState {
  const existingState = basketStateByToken.get(basketToken)

  if (existingState) {
    return existingState
  }

  const nextState: BasketState = {
    checkoutCompleted: false,
    hasZeroTotalCode: false,
    hasReservation: false,
  }
  basketStateByToken.set(basketToken, nextState)

  return nextState
}

function invalidQueryResponse(operation: string) {
  return HttpResponse.json(
    {
      errorCode: 'UNEXPECTED_QUERY',
      errorMessage: `Unexpected query parameters for ${operation}.`,
      status: 'error',
    },
    { status: 400 },
  )
}

function invalidRequestBodyResponse(operation: string) {
  return HttpResponse.json(
    {
      errorCode: 'UNEXPECTED_BODY',
      errorMessage: `Unexpected request body for ${operation}.`,
      status: 'error',
    },
    { status: 400 },
  )
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function isValidAddToBasketBody(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.count === 1 &&
    typeof value.product_id === 'string' &&
    value.reservation_count === 1 &&
    isStorefrontDate(value.reservation_datestart) &&
    isStorefrontTime(value.reservation_timeend) &&
    isStorefrontTime(value.reservation_timestart) &&
    value.resource_count === 1 &&
    value.version === 'fi_FI'
  )
}

function isValidCheckoutBody(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.allowmarketing === 0 &&
    value.consolidated === 0 &&
    value.country === null &&
    Array.isArray(value.deliveryRules) &&
    typeof value.email === 'string' &&
    value.master === 1 &&
    value.more === null &&
    typeof value.name === 'string' &&
    (value.payment === 'mobilepay' || value.payment === 'cash') &&
    typeof value.phone === 'string' &&
    value.terms_accepted === 1 &&
    value.version === 'fi_FI'
  )
}

function isValidApplyCodeBody(value: unknown): boolean {
  return isRecord(value) && typeof value.code === 'string'
}

function hasExpectedCode(value: unknown, expectedCode: string): boolean {
  return isRecord(value) && value.code === expectedCode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStorefrontDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(value)
}

function isStorefrontTime(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}\.\d{2}$/.test(value)
}

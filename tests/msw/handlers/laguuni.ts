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
import discountAcceptedFixture from '../../fixtures/laguuni/booking/discount-accepted.json'
import discountInvalidFixture from '../../fixtures/laguuni/booking/discount-invalid.json'
import valueCardAcceptedFixture from '../../fixtures/laguuni/booking/valuecard-accepted.json'
import valueCardInvalidFixture from '../../fixtures/laguuni/booking/valuecard-invalid.json'
import voucherAcceptedPaymentFixture from '../../fixtures/laguuni/booking/voucher-accepted-payment-required.json'
import voucherAcceptedZeroFixture from '../../fixtures/laguuni/booking/voucher-accepted-zero-balance.json'
import voucherInvalidFixture from '../../fixtures/laguuni/booking/voucher-invalid.json'

const availabilityFixtureByProductId = {
  '157': hietsuAvailabilityFixture,
  '6': proAvailabilityFixture,
  '7': easyAvailabilityFixture,
}

const TEST_API_BASE_URL = normalizeApiBaseUrl(
  process.env.LAGUUNI_API_BASE_URL ?? DEFAULT_LAGUUNI_API_BASE_URL,
)

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
    `${TEST_API_BASE_URL}/api/laguuni/valuecards/:code/public.json`,
    ({ params }) => {
      const code = String(params.code)

      if (code === 'FIXTURE-VALUECARD') {
        return HttpResponse.json(valueCardAcceptedFixture)
      }

      return HttpResponse.json(valueCardInvalidFixture, { status: 404 })
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

  http.get(
    `${TEST_API_BASE_URL}/api/laguuni/vouchers/:code.json`,
    ({ params, request }) => {
      const code = String(params.code)
      const url = new URL(request.url)

      if (
        url.searchParams.get('action') !== 'check' ||
        !url.searchParams.get('basket')
      ) {
        return invalidQueryResponse('voucher lookup')
      }

      if (code === 'FIXTURE-VOUCHER-ZERO') {
        return HttpResponse.json(voucherAcceptedZeroFixture)
      }

      if (code === 'FIXTURE-VOUCHER-PAYMENT') {
        return HttpResponse.json(voucherAcceptedPaymentFixture)
      }

      return HttpResponse.json(voucherInvalidFixture, { status: 404 })
    },
  ),

  http.post(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items/new.json`,
    async ({ request }) => {
      const body = await readRequestBody(request)

      if (!isValidAddToBasketBody(body)) {
        return invalidRequestBodyResponse('add reservation')
      }

      return HttpResponse.json(addToBasketFixture)
    },
  ),

  http.post(
    `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
    async ({ params, request }) => {
      const body = await readRequestBody(request)

      if (!isValidCheckoutBody(body)) {
        return invalidRequestBodyResponse('submit checkout')
      }

      if (String(params.basketToken) === 'fixture-basket-payment') {
        return HttpResponse.json(checkoutPaymentRequiredFixture)
      }

      if (String(params.basketToken) === 'fixture-basket-failure') {
        return HttpResponse.json(checkoutFailureFixture)
      }

      return HttpResponse.json(checkoutSuccessFixture)
    },
  ),
]

function matchesSearchParams(
  url: URL,
  expectedParams: Record<string, string>,
): boolean {
  return Object.entries(expectedParams).every(
    ([key, value]) => url.searchParams.get(key) === value,
  )
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
    value.payment === 'bambora' &&
    typeof value.phone === 'string' &&
    value.terms_accepted === 1 &&
    value.version === 'fi_FI'
  )
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

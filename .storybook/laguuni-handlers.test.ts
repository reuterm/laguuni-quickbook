import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import checkoutFailureFixture from '../tests/fixtures/laguuni/booking/checkout-failure.json'
import checkoutPaymentRequiredFixture from '../tests/fixtures/laguuni/booking/checkout-payment-required.json'
import {
  createStorybookLaguuniHandlers,
  getStorybookLaguuniApiBaseUrl,
  pruneStorybookLaguuniScope,
  type StorybookLaguuniScenario,
} from './laguuni-handlers'

const server = setupServer()
const baseUrl = 'http://storybook.laguuni.invalid'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('createStorybookLaguuniHandlers', () => {
  it('isolates basket mutation state across separately created baskets', async () => {
    server.use(...createStorybookLaguuniHandlers({ baseUrl }))

    const firstBasketToken = await createBasket(baseUrl)
    const secondBasketToken = await createBasket(baseUrl)

    expect(firstBasketToken).not.toBe(secondBasketToken)

    await addReservation(baseUrl, firstBasketToken)

    await expect(loadBasketItems(baseUrl, firstBasketToken)).resolves.toEqual([
      {
        discountedprice: null,
        price: '26',
      },
    ])
    await expect(loadBasketItems(baseUrl, secondBasketToken)).resolves.toEqual(
      [],
    )
  })

  it.each([
    ['payment-required', checkoutPaymentRequiredFixture],
    ['failed-booking', checkoutFailureFixture],
  ] satisfies Array<
    [StorybookLaguuniScenario, unknown]
  >)('uses an explicit %s checkout scenario', async (checkoutScenario, expectedResponse) => {
    server.use(
      ...createStorybookLaguuniHandlers({
        baseUrl,
        checkoutScenario,
      }),
    )

    const basketToken = await createBasket(baseUrl)
    await addReservation(baseUrl, basketToken)

    await expect(submitCheckout(baseUrl, basketToken)).resolves.toEqual(
      expectedResponse,
    )
  })

  it('uses an explicit invalid-code scenario', async () => {
    server.use(
      ...createStorybookLaguuniHandlers({
        baseUrl: `${baseUrl}/__storybook/laguuni/:scopeId/:scenario`,
      }),
    )

    const scopedBaseUrl = `${baseUrl}${
      new URL(
        getStorybookLaguuniApiBaseUrl('invalid-code-scope', 'invalid-code'),
      ).pathname
    }`

    const response = await fetch(
      `${scopedBaseUrl}/api/laguuni/discounts/INVALID/public.json`,
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Antamasi koodi on virheellinen.',
      status: 'error',
    })
  })

  it('lets scenario-specific availability handlers override the shared default handler', async () => {
    server.use(
      ...createStorybookLaguuniHandlers({
        baseUrl: `${baseUrl}/__storybook/laguuni/:scopeId/:scenario`,
      }),
    )

    const scopedBaseUrl = `${baseUrl}${
      new URL(
        getStorybookLaguuniApiBaseUrl(
          'availability-error-scope',
          'availability-error',
        ),
      ).pathname
    }`

    const response = await fetch(
      `${scopedBaseUrl}/api/laguuni/products/7/availabledates/2026-05-14.json?count=1&field=hourlyfrom&mode=hours&required_resources=true&resource_count=1`,
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Fixture outage',
      status: 'error',
    })
  })

  it('prunes completed basket state for a finished Storybook scope', async () => {
    server.use(
      ...createStorybookLaguuniHandlers({
        baseUrl: `${baseUrl}/__storybook/laguuni/:scopeId/:scenario`,
      }),
    )

    const scopedBaseUrl = `${baseUrl}${
      new URL(getStorybookLaguuniApiBaseUrl('completed-scope')).pathname
    }`
    const basketToken = await createBasket(scopedBaseUrl)

    await addReservation(scopedBaseUrl, basketToken)
    await submitCheckout(scopedBaseUrl, basketToken)

    await expect(loadBasketItems(scopedBaseUrl, basketToken)).resolves.toEqual(
      [],
    )

    pruneStorybookLaguuniScope('completed-scope')

    await addReservation(scopedBaseUrl, basketToken)

    await expect(loadBasketItems(scopedBaseUrl, basketToken)).resolves.toEqual([
      {
        discountedprice: null,
        price: '26',
      },
    ])
  })
})

async function createBasket(requestBaseUrl: string): Promise<string> {
  const response = await fetch(`${requestBaseUrl}/api/laguuni/baskets.json`)

  return response.json()
}

async function addReservation(
  requestBaseUrl: string,
  basketToken: string,
): Promise<void> {
  const response = await fetch(
    `${requestBaseUrl}/api/laguuni/fi_FI/baskets/${basketToken}/items/new.json`,
    {
      body: JSON.stringify({
        count: 1,
        product_id: '7',
        reservation_count: 1,
        reservation_datestart: '14.05.2026',
        reservation_timeend: '12.00',
        reservation_timestart: '11.00',
        resource_count: 1,
        version: 'fi_FI',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  expect(response.ok).toBe(true)
}

async function loadBasketItems(
  requestBaseUrl: string,
  basketToken: string,
): Promise<unknown> {
  const response = await fetch(
    `${requestBaseUrl}/api/laguuni/fi_FI/baskets/${basketToken}/items.json?publicreservations=true`,
  )

  return response.json()
}

async function submitCheckout(
  requestBaseUrl: string,
  basketToken: string,
): Promise<unknown> {
  const response = await fetch(
    `${requestBaseUrl}/api/laguuni/fi_FI/orders/${basketToken}.json`,
    {
      body: JSON.stringify({
        allowmarketing: 0,
        consolidated: 0,
        country: null,
        deliveryRules: [],
        email: 'storybook@example.com',
        master: 1,
        more: null,
        name: 'Storybook User',
        payment: 'cash',
        phone: '0401234567',
        terms_accepted: 1,
        version: 'fi_FI',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  return response.json()
}

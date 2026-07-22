import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import checkoutFailureFixture from '../../../tests/fixtures/laguuni/booking/checkout-failure.json'
import checkoutPaymentRequiredFixture from '../../../tests/fixtures/laguuni/booking/checkout-payment-required.json'
import { localDate } from '../../../tests/local-date'
import { server } from '../../../tests/msw/server'
import {
  DEFAULT_LAGUUNI_API_BASE_URL,
  FetchHttpClient,
  normalizeApiBaseUrl,
} from '../../lib/api/client'
import { LaguuniApiClient } from '../../lib/api/laguuni-api'
import { createMemoryStorage } from '../../test/create-memory-storage'
import {
  clearPersistedAppState,
  saveUserSettings,
} from '../../test/persisted-state'
import { renderApp } from '../../test/render-app'
import { LocalDiagnosticsStore } from '../diagnostics/logs'
import { DefaultBookingService } from './booking-service'

const TEST_API_BASE_URL = normalizeApiBaseUrl(DEFAULT_LAGUUNI_API_BASE_URL)

const MOBILEPAY_HANDLER_REDIRECT = {
  redirectUrl:
    'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
}

function createAvailabilityResponse(capacityAtThreePm: number) {
  return {
    endtimes: {
      '15.00': ['16.00'],
    },
    starttimes: ['15.00'],
    tuples: [
      [0, 900, 4],
      [900, 960, capacityAtThreePm],
      [960, 1440, 4],
    ],
    tomorrowtuples: [[0, 1440, 4]],
  }
}

describe('booking flow integration', () => {
  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
    vi.useRealTimers()
  })

  it('keeps the availability overview read-only until booking details are saved', async () => {
    renderApp({ storage: createMemoryStorage() })

    expect(
      screen.getByText(
        /If you would rather not store them, you can keep using the app in read-only mode\./,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()
  })

  it('submits two selections, one discount, and one order through one basket', async () => {
    const itemBasketTokens: string[] = []
    const orderBasketTokens: string[] = []
    const itemBodies: unknown[] = []

    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items/new.json`,
        async ({ params, request }) => {
          itemBasketTokens.push(String(params.basketToken))
          itemBodies.push(await request.json())
          return HttpResponse.json(249253)
        },
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items.json`,
        () => HttpResponse.json([{ discountedprice: '0', price: '26' }]),
      ),
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        ({ params }) => {
          orderBasketTokens.push(String(params.basketToken))
          return HttpResponse.json('fixture-order-id')
        },
      ),
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/completeorderhandler/:identifier/cashreturn.json`,
        ({ params }) =>
          HttpResponse.json({
            items: {
              identifier: String(params.identifier),
              payment: 'cash',
              success: true,
            },
          }),
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:identifier.json`,
        ({ params }) =>
          HttpResponse.json({
            completed: '1',
            identifier: String(params.identifier),
            paid: '1',
            payment: 'cash',
          }),
      ),
    )
    const service = new DefaultBookingService({
      api: new LaguuniApiClient({
        client: new FetchHttpClient({
          baseUrl: TEST_API_BASE_URL,
          fetchImplementation: globalThis.fetch.bind(globalThis),
        }),
      }),
    })
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: 'test-version',
      storage: createMemoryStorage(),
    })

    const submission = await service.book(
      {
        code: 'FIXTURE-DISCOUNT',
        profile: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+358401234567',
        },
        selections: [
          {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          {
            cableId: 'pro',
            date: localDate('2026-05-21'),
            endTime: '17:00',
            startTime: '16:00',
          },
        ],
      },
      diagnostics.beginTrace({ name: 'booking' }),
    )

    expect(submission.result.status).toBe('success')
    expect(itemBasketTokens).toHaveLength(3)
    expect([...new Set(itemBasketTokens)]).toHaveLength(1)
    expect(itemBodies).toHaveLength(3)
    expect(
      itemBodies.filter(
        (body) => typeof body === 'object' && body !== null && 'code' in body,
      ),
    ).toHaveLength(1)
    expect(orderBasketTokens).toEqual([itemBasketTokens[0]])
  })

  it('shows a failure state when checkout returns an error', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
      },
      storage,
    )
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutFailureFixture, { status: 200 }),
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          return HttpResponse.json(null)
        },
      ),
    )

    renderApp({ storage })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'could not be completed during checkout',
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(deletedBasketTokens).toHaveLength(1)
    })
  })

  it('releases a failed basket reservation without checkout and retains its review', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: string[] = []
    const checkoutRequests: string[] = []
    const storage = createBookingStorage()

    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items/new.json`,
        () => HttpResponse.json({ status: 'unavailable' }, { status: 500 }),
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          return HttpResponse.json(null)
        },
      ),
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        ({ request }) => {
          checkoutRequests.push(request.url)
          return HttpResponse.json({ status: 'unexpected' }, { status: 500 })
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })
    await createMixedCableBasket(user)
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(deletedBasketTokens).toHaveLength(1))
    expect(checkoutRequests).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.getByRole('button', { name: 'Review 2 selected slots' }),
    ).toBeVisible()
  })

  it('keeps a mixed-cable basket until every availability refresh settles', async () => {
    const user = userEvent.setup()
    const storage = createBookingStorage()
    const refreshRequests: Array<{ date: string; productId: string }> = []
    let deferRefreshes = false
    let resolveEasyRefresh: (() => void) | undefined
    let resolveProRefresh: (() => void) | undefined
    const easyRefresh = new Promise<void>((resolve) => {
      resolveEasyRefresh = resolve
    })
    const proRefresh = new Promise<void>((resolve) => {
      resolveProRefresh = resolve
    })

    server.use(
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/products/:productId/availabletimes/:date.json`,
        async ({ params, request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('capacity') !== 'true') return

          const productId = String(params.productId)
          const date = String(params.date)
          if (deferRefreshes && (productId === '6' || productId === '7')) {
            refreshRequests.push({ date, productId })
            await (productId === '6' ? proRefresh : easyRefresh)
          }

          return HttpResponse.json(createAvailabilityResponse(3))
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })
    await createMixedCableBasket(user)
    deferRefreshes = true
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(refreshRequests).toHaveLength(2))
    expect(refreshRequests).toEqual(
      expect.arrayContaining([
        { date: '2026-05-20', productId: '6' },
        { date: '2026-05-21', productId: '7' },
      ]),
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(
      screen.getByRole('button', { name: 'Review 2 selected slots' }),
    ).toBeVisible()

    resolveProRefresh?.()
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Review 2 selected slots' }),
      ).toBeVisible()
    })

    resolveEasyRefresh?.()
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Review 2 selected slots' }),
      ).not.toBeInTheDocument()
    })
  })

  it('preserves a replacement basket when an earlier refresh completion clears', async () => {
    const user = userEvent.setup()
    const storage = createBookingStorage()
    let deferRefreshes = false
    let resolveEasyRefresh: (() => void) | undefined
    let resolveProRefresh: (() => void) | undefined
    const easyRefresh = new Promise<void>((resolve) => {
      resolveEasyRefresh = resolve
    })
    const proRefresh = new Promise<void>((resolve) => {
      resolveProRefresh = resolve
    })

    server.use(
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/products/:productId/availabletimes/:date.json`,
        async ({ params, request }) => {
          if (new URL(request.url).searchParams.get('capacity') !== 'true') return

          const productId = String(params.productId)
          if (deferRefreshes && (productId === '6' || productId === '7')) {
            await (productId === '6' ? proRefresh : easyRefresh)
          }

          return HttpResponse.json(createAvailabilityResponse(3))
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })
    await createMixedCableBasket(user)
    deferRefreshes = true
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
    await screen.findByRole('heading', { name: 'Booking confirmed' })

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'Review 2 selected slots' }))
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    await clickFirstBookButton(user)
    await user.click(screen.getByRole('button', { name: 'Add more' }))

    expect(screen.getByRole('button', { name: 'Review selection' })).toBeVisible()

    resolveProRefresh?.()
    resolveEasyRefresh?.()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Review selection' })).toBeVisible()
    })
  })

  it('shows payment required when checkout returns a plain token string', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    const cancelledPaymentTokens: Array<string> = []
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
      },
      storage,
    )
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutPaymentRequiredFixture),
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
        () => HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT),
      ),
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/completeorderhandler/:paymentToken/mobilepayreturn.json`,
        ({ params }) => {
          cancelledPaymentTokens.push(String(params.paymentToken))
          return HttpResponse.json(null)
        },
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          return HttpResponse.json(null)
        },
      ),
    )

    renderApp({ storage })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Continue to payment' }),
    ).toHaveAttribute(
      'href',
      'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
    )
    expect(
      screen.getByRole('link', { name: 'Continue to payment' }),
    ).toHaveAttribute('target', '_blank')

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(cancelledPaymentTokens).toHaveLength(1)
      expect(deletedBasketTokens).toHaveLength(1)
    })
  })

  it('deletes and refreshes availability when a payment-required booking is dismissed', async () => {
    const user = userEvent.setup()
    const cancelledPaymentTokens: Array<string> = []
    const deletedBasketTokens: Array<string> = []
    let hasDeletedBasket = false
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
      },
      storage,
    )
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutPaymentRequiredFixture),
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
        () => HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT),
      ),
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/completeorderhandler/:paymentToken/mobilepayreturn.json`,
        ({ params }) => {
          cancelledPaymentTokens.push(String(params.paymentToken))
          return HttpResponse.json(null)
        },
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          hasDeletedBasket = true
          return HttpResponse.json(null)
        },
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/products/:productId/availabletimes/:date.json`,
        ({ params, request }) => {
          const url = new URL(request.url)

          if (
            String(params.productId) !== '6' ||
            url.searchParams.get('capacity') !== 'true'
          ) {
            return
          }

          return HttpResponse.json(
            createAvailabilityResponse(hasDeletedBasket ? 2 : 3),
          )
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await expectCapacityLabel('3')

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(cancelledPaymentTokens).toHaveLength(1)
      expect(deletedBasketTokens).toHaveLength(1)
    })

    await expectCapacityLabel('2')
  })

  it('deletes and refreshes availability when a failed booking is dismissed', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    let hasDeletedBasket = false
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
      },
      storage,
    )
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutFailureFixture, { status: 200 }),
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          hasDeletedBasket = true
          return HttpResponse.json(null)
        },
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/products/:productId/availabletimes/:date.json`,
        ({ params, request }) => {
          const url = new URL(request.url)

          if (
            String(params.productId) !== '6' ||
            url.searchParams.get('capacity') !== 'true'
          ) {
            return
          }

          return HttpResponse.json(
            createAvailabilityResponse(hasDeletedBasket ? 2 : 3),
          )
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await expectCapacityLabel('3')

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(deletedBasketTokens).toHaveLength(1)
    })

    await expectCapacityLabel('2')
  })

  it('allows dismissing a failed booking status', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
      },
      storage,
    )
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () =>
          HttpResponse.json(
            {
              errorCode: 'GENERAL_ERROR',
              errorMessage: 'Fixture checkout failed.',
              status: 'error',
            },
            { status: 200 },
          ),
      ),
    )

    renderApp({ storage })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Booking failed' }),
      ).not.toBeInTheDocument()
    })
  })

  it('shows a successful booking status', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
        seasonPassCode: 'FIXTURE-DISCOUNT',
      },
      storage,
    )

    renderApp({ storage })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()
  })

  it('allows dismissing the confirmation sheet without submitting a booking', async () => {
    const user = userEvent.setup()
    const orderRequests: Array<string> = []
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
        seasonPassCode: 'FIXTURE-DISCOUNT',
      },
      storage,
    )
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        ({ request }) => {
          orderRequests.push(request.url)
          return HttpResponse.json(
            { status: 'unexpected-test-request' },
            { status: 500 },
          )
        },
      ),
    )

    renderApp({ storage })
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Confirm booking' }),
      ).not.toBeInTheDocument()
    })
    expect(orderRequests).toHaveLength(0)
  })

  it('keeps the success sheet open until the user dismisses it', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
        seasonPassCode: 'FIXTURE-DISCOUNT',
      },
      storage,
    )

    renderApp({ storage })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Booking confirmed' }),
      ).not.toBeInTheDocument()
    })
  })

  it('refreshes the availability overview after a completed booking', async () => {
    const user = userEvent.setup()
    let availabilityRequestCount = 0
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
        seasonPassCode: 'FIXTURE-DISCOUNT',
      },
      storage,
    )
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/products/:productId/availabletimes/:date.json`,
        ({ params, request }) => {
          const url = new URL(request.url)

          if (
            String(params.productId) !== '6' ||
            url.searchParams.get('capacity') !== 'true'
          ) {
            return
          }

          availabilityRequestCount += 1

          if (availabilityRequestCount < 8) {
            return HttpResponse.json({
              endtimes: {
                '15.00': ['16.00'],
              },
              starttimes: ['15.00'],
              tuples: [
                [0, 900, 4],
                [900, 960, 3],
                [960, 1440, 4],
              ],
              tomorrowtuples: [[0, 1440, 4]],
            })
          }

          return HttpResponse.json({
            endtimes: {
              '15.00': ['16.00'],
            },
            starttimes: ['15.00'],
            tuples: [
              [0, 900, 4],
              [900, 960, 2],
              [960, 1440, 4],
            ],
            tomorrowtuples: [[0, 1440, 4]],
          })
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await expectCapacityLabel('3')

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()

    await expectCapacityLabel('2')
  })
})

async function expectCapacityLabel(label: string) {
  const matches = await screen.findAllByText(label)

  expect(matches.length).toBeGreaterThan(0)
}

async function clickFirstBookButton(user: ReturnType<typeof userEvent.setup>) {
  const bookButtons = await screen.findAllByRole('button', {
    name: 'Book',
  })
  const firstBookButton = bookButtons[0]

  if (!firstBookButton) {
    throw new Error('Expected at least one Book button')
  }

  await user.click(firstBookButton)
}

async function confirmFirstBooking(user: ReturnType<typeof userEvent.setup>) {
  await clickFirstBookButton(user)

  expect(
    await screen.findByRole('heading', { name: 'Confirm booking' }),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
}

function createBookingStorage() {
  const storage = createMemoryStorage()

  saveUserSettings(
    {
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-DISCOUNT',
    },
    storage,
  )

  return storage
}

async function createMixedCableBasket(user: ReturnType<typeof userEvent.setup>) {
  await clickFirstBookButton(user)
  await user.click(screen.getByRole('button', { name: 'Add more' }))
  await user.click(screen.getByRole('tab', { name: 'Easy' }))

  const secondDay = await screen.findByRole('heading', { name: 'Thu 21 May' })
  const secondDaySection = secondDay.closest('section')
  if (secondDaySection === null) {
    throw new Error('Expected the second Easy cable day group')
  }

  await user.click(
    within(secondDaySection).getAllByRole('button', { name: /^Add / })[0]!,
  )
  await user.click(screen.getByRole('button', { name: 'Review 2 selected slots' }))
}

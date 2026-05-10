import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import checkoutFailureFixture from '../../../tests/fixtures/laguuni/booking/checkout-failure.json'
import checkoutPaymentRequiredFixture from '../../../tests/fixtures/laguuni/booking/checkout-payment-required.json'
import { server } from '../../../tests/msw/server'
import {
  DEFAULT_LAGUUNI_API_BASE_URL,
  normalizeApiBaseUrl,
} from '../../lib/api/client'
import {
  clearPersistedAppState,
  saveUserSettings,
} from '../../test/persisted-state'
import { renderApp } from '../../test/render-app'

const TEST_API_BASE_URL = normalizeApiBaseUrl(DEFAULT_LAGUUNI_API_BASE_URL)

const MOBILEPAY_HANDLER_REDIRECT = {
  redirectUrl:
    'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
}

function saveBookingProfile(
  overrides?: Partial<{
    email: string
    name: string
    phone: string
    seasonPassCode: string
  }>,
) {
  saveUserSettings({
    email: 'test@example.com',
    name: 'Test User',
    phone: '+358401234567',
    ...overrides,
  })
}

function setupPaymentRequiredFlow(options?: {
  deleteBasket?: Parameters<typeof http.delete>[1]
}) {
  server.use(
    http.post(
      `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
      () => HttpResponse.json(checkoutPaymentRequiredFixture),
    ),
    http.get(
      `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
      () => HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT),
    ),
    http.delete(
      `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
      options?.deleteBasket ?? (() => HttpResponse.json(null)),
    ),
  )
}

function setupCapacityRefresh(options: { resolveCapacity(): number }) {
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

        return HttpResponse.json(
          createAvailabilityResponse(options.resolveCapacity()),
        )
      },
    ),
  )
}

function createBasketCleanupTracker() {
  const deletedBasketTokens: Array<string> = []
  let hasCleanedUpBasket = false

  return {
    deletedBasketTokens,
    handleDeleteBasket: ({ params }: { params: { basketToken?: string } }) => {
      deletedBasketTokens.push(String(params.basketToken))
      hasCleanedUpBasket = true
      return HttpResponse.json(null)
    },
    resolveCapacity() {
      return hasCleanedUpBasket ? 2 : 3
    },
  }
}

type BasketCleanupFailureScenario = {
  configureFailure(tracker: ReturnType<typeof createBasketCleanupTracker>): void
  name: string
}

async function expectCleanupRefreshForFailureScenario(
  scenario: BasketCleanupFailureScenario,
) {
  const user = userEvent.setup()
  const basketCleanupTracker = createBasketCleanupTracker()

  setupCapacityRefresh({
    resolveCapacity: () => basketCleanupTracker.resolveCapacity(),
  })
  scenario.configureFailure(basketCleanupTracker)

  renderApp({
    availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
  })

  await expectInitialCapacity('3/4')
  await confirmFirstBooking(user)

  expect(
    await screen.findByRole('heading', { name: 'Booking failed' }),
  ).toBeInTheDocument()

  await expectBasketCleanupRefreshAfterDismiss({
    deletedBasketTokens: basketCleanupTracker.deletedBasketTokens,
    refreshedCapacityLabel: '2/4',
    user,
  })
}

async function expectBasketCleanupRefreshAfterDismiss(options: {
  deletedBasketTokens: Array<string>
  refreshedCapacityLabel: string
  user: ReturnType<typeof userEvent.setup>
}) {
  await options.user.click(screen.getByRole('button', { name: 'Close' }))

  await waitFor(() => {
    expect(options.deletedBasketTokens).toHaveLength(1)
  })

  await waitFor(() => {
    expect(
      screen.getAllByText(options.refreshedCapacityLabel),
    ).not.toHaveLength(0)
  })
}

async function expectInitialCapacity(capacityLabel: string) {
  expect(await screen.findAllByText(capacityLabel)).not.toHaveLength(0)
}

describe('booking flow integration', () => {
  const FAST_SUCCESS_DISMISS_DELAY_MS = 100

  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
    vi.useRealTimers()
  })

  const basketCleanupFailureScenarios: BasketCleanupFailureScenario[] = [
    {
      configureFailure(tracker) {
        saveBookingProfile({ seasonPassCode: 'BROKEN-CODE' })
        server.use(
          http.get(
            `${TEST_API_BASE_URL}/api/laguuni/discounts/BROKEN-CODE/public.json`,
            () =>
              HttpResponse.json(
                {
                  errorCode: 'GENERAL_ERROR',
                  errorMessage: 'Antamasi koodi on virheellinen.',
                },
                { status: 404 },
              ),
          ),
          http.delete(
            `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
            tracker.handleDeleteBasket,
          ),
        )
      },
      name: 'runs basket cleanup and refreshes availability when code validation fails after reservation creation',
    },
    {
      configureFailure(tracker) {
        saveBookingProfile()
        server.use(
          http.post(
            `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items/new.json`,
            () => HttpResponse.error(),
          ),
          http.delete(
            `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
            tracker.handleDeleteBasket,
          ),
        )
      },
      name: 'runs basket cleanup and refreshes availability when adding the reservation fails',
    },
    {
      configureFailure(tracker) {
        saveBookingProfile({ seasonPassCode: 'FIXTURE-DISCOUNT' })
        server.use(
          http.post(
            `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items/new.json`,
            async ({ request }) => {
              const body = await request.json()

              if (body && typeof body === 'object' && 'code' in body) {
                return HttpResponse.error()
              }

              return
            },
          ),
          http.delete(
            `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
            tracker.handleDeleteBasket,
          ),
        )
      },
      name: 'runs basket cleanup and refreshes availability when applying the code fails',
    },
    {
      configureFailure(tracker) {
        saveBookingProfile()
        server.use(
          http.get(
            `${TEST_API_BASE_URL}/api/laguuni/fi_FI/baskets/:basketToken/items.json`,
            ({ params, request }) => {
              const url = new URL(request.url)

              if (
                String(params.basketToken).length > 0 &&
                url.searchParams.get('publicreservations') === 'true'
              ) {
                return HttpResponse.error()
              }

              return
            },
          ),
          http.delete(
            `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
            tracker.handleDeleteBasket,
          ),
        )
      },
      name: 'runs basket cleanup and refreshes availability when basket pricing fails',
    },
  ]

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the availability overview read-only until booking details are saved', async () => {
    renderApp()

    expect(
      screen.getByText(
        /If you would rather not store them, you can keep using the app in read-only mode\./,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()
  })

  it('shows a failure state when checkout returns an error', async () => {
    const user = userEvent.setup()

    saveBookingProfile()
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutFailureFixture, { status: 200 }),
      ),
    )

    renderApp({
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'could not be completed during checkout',
    )
  })

  it('shows payment required when checkout returns a plain token string', async () => {
    const user = userEvent.setup()

    saveBookingProfile()
    setupPaymentRequiredFlow()

    renderApp({
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()
    const paymentLink = screen.getByRole('link', {
      name: 'Continue to payment',
    })

    expect(paymentLink).toHaveAttribute(
      'href',
      'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
    )
    expect(paymentLink).toHaveAttribute('target', '_blank')
    expect(paymentLink).toHaveAttribute('rel', 'noopener noreferrer')

    await user.click(paymentLink)
  })

  it('closes payment-required booking even when basket cleanup fails', async () => {
    const user = userEvent.setup()

    saveBookingProfile()
    setupPaymentRequiredFlow({
      deleteBasket: () =>
        HttpResponse.json({ status: 'delete-failed' }, { status: 500 }),
    })

    renderApp({
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Payment required' }),
      ).not.toBeInTheDocument()
    })
  })

  it('closes and refreshes when basket cleanup returns 404', async () => {
    const user = userEvent.setup()
    let refreshRequests = 0

    saveBookingProfile()
    setupPaymentRequiredFlow({
      deleteBasket: () => HttpResponse.json(null, { status: 404 }),
    })
    setupCapacityRefresh({
      resolveCapacity() {
        refreshRequests += 1
        return refreshRequests >= 2 ? 2 : 3
      },
    })

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    await expectInitialCapacity('3/4')

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Payment required' }),
      ).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getAllByText('2/4')).not.toHaveLength(0)
    })
  })

  for (const scenario of basketCleanupFailureScenarios) {
    it(scenario.name, async () => {
      await expectCleanupRefreshForFailureScenario(scenario)
    })
  }

  it('deletes the basket and refreshes availability when dismissing payment-required booking', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    let hasCleanedUpBasket = false
    let resolveDeleteBasket!: () => void

    saveBookingProfile()
    setupPaymentRequiredFlow({
      deleteBasket: ({ params }) => {
        deletedBasketTokens.push(String(params.basketToken))

        return new Promise((resolve) => {
          resolveDeleteBasket = () => {
            hasCleanedUpBasket = true
            resolve(HttpResponse.json(null))
          }
        })
      },
    })
    setupCapacityRefresh({
      resolveCapacity() {
        return hasCleanedUpBasket ? 2 : 3
      },
    })

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    await expectInitialCapacity('3/4')

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.queryByRole('heading', { name: 'Payment required' }),
    ).not.toBeInTheDocument()

    await waitFor(() => {
      expect(deletedBasketTokens).toHaveLength(1)
    })

    expect(screen.getAllByText('3/4')).not.toHaveLength(0)
    expect(screen.queryByText('2/4')).not.toBeInTheDocument()

    resolveDeleteBasket()

    await waitFor(() => {
      expect(screen.getAllByText('2/4')).not.toHaveLength(0)
    })
  })

  it('allows dismissing a failed booking status', async () => {
    const user = userEvent.setup()

    saveBookingProfile()
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

    renderApp({
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.queryByRole('heading', { name: 'Booking failed' }),
    ).not.toBeInTheDocument()
  })

  it('runs basket cleanup and refreshes availability when checkout throws after basket creation', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    let hasCleanedUpBasket = false

    saveBookingProfile()
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.error(),
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          hasCleanedUpBasket = true
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
            createAvailabilityResponse(hasCleanedUpBasket ? 2 : 3),
          )
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    await expectInitialCapacity('3/4')

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(deletedBasketTokens).toHaveLength(1)
    })

    await waitFor(() => {
      expect(screen.getAllByText('2/4')).not.toHaveLength(0)
    })
  })

  it('shows a successful booking status', async () => {
    const user = userEvent.setup()

    saveBookingProfile({ seasonPassCode: 'FIXTURE-DISCOUNT' })

    renderApp({
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()
  })

  it('allows dismissing the confirmation sheet without submitting a booking', async () => {
    const user = userEvent.setup()
    const orderRequests: Array<string> = []

    saveBookingProfile({ seasonPassCode: 'FIXTURE-DISCOUNT' })
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

    renderApp()
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.queryByRole('heading', { name: 'Confirm booking' }),
    ).not.toBeInTheDocument()
    expect(orderRequests).toHaveLength(0)
  })

  it('auto-dismisses the success sheet after the success delay', async () => {
    const user = userEvent.setup()

    saveBookingProfile({ seasonPassCode: 'FIXTURE-DISCOUNT' })

    renderApp({
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Booking confirmed' }),
      ).not.toBeInTheDocument()
    })
  })

  it('refreshes the availability overview after a successful booking is dismissed', async () => {
    const user = userEvent.setup()
    let relevantAvailabilityRequestCount = 0
    let refreshRequestsStartAt = Number.POSITIVE_INFINITY

    saveBookingProfile({ seasonPassCode: 'FIXTURE-DISCOUNT' })
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

          relevantAvailabilityRequestCount += 1

          if (relevantAvailabilityRequestCount < refreshRequestsStartAt) {
            return HttpResponse.json(createAvailabilityResponse(3))
          }

          return HttpResponse.json(createAvailabilityResponse(2))
        },
      ),
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      bookingSuccessDismissDelayMs: FAST_SUCCESS_DISMISS_DELAY_MS,
    })

    await expectInitialCapacity('3/4')
    refreshRequestsStartAt = relevantAvailabilityRequestCount + 1

    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Booking confirmed' }),
      ).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getAllByText('2/4')).not.toHaveLength(0)
    })
  })

  it('finalizes basket cleanup when the app unmounts during an in-flight booking', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    let resolveCheckout!: () => void

    saveBookingProfile()
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () =>
          new Promise((resolve) => {
            resolveCheckout = () => {
              resolve(HttpResponse.json(checkoutPaymentRequiredFixture))
            }
          }),
      ),
      http.delete(
        `${TEST_API_BASE_URL}/api/laguuni/baskets/:basketToken.json`,
        ({ params }) => {
          deletedBasketTokens.push(String(params.basketToken))
          return HttpResponse.json(null)
        },
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
        () => HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT),
      ),
    )

    const view = renderApp()
    await confirmFirstBooking(user)

    view.unmount()
    resolveCheckout()

    await waitFor(() => {
      expect(deletedBasketTokens).toHaveLength(1)
    })
  })

  it('finalizes basket cleanup when the app unmounts from payment-required state', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []

    saveBookingProfile()
    setupPaymentRequiredFlow({
      deleteBasket: ({ params }) => {
        deletedBasketTokens.push(String(params.basketToken))
        return HttpResponse.json(null)
      },
    })

    const view = renderApp()
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()

    view.unmount()

    await waitFor(() => {
      expect(deletedBasketTokens).toHaveLength(1)
    })
  })
})

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

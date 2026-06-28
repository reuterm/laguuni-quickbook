import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
import { createMemoryStorage } from '../../test/create-memory-storage'
import { renderApp } from '../../test/render-app'

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

  it('shows a failure state when checkout returns an error', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    const storage = createMemoryStorage()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    }, storage)
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

  it('shows payment required when checkout returns a plain token string', async () => {
    const user = userEvent.setup()
    const deletedBasketTokens: Array<string> = []
    const cancelledPaymentTokens: Array<string> = []
    const storage = createMemoryStorage()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    }, storage)
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

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    }, storage)
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

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    }, storage)
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

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    }, storage)
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

    expect(
      screen.queryByRole('heading', { name: 'Booking failed' }),
    ).not.toBeInTheDocument()
  })

  it('shows a successful booking status', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-DISCOUNT',
    }, storage)

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

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-DISCOUNT',
    }, storage)
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

    expect(
      screen.queryByRole('heading', { name: 'Confirm booking' }),
    ).not.toBeInTheDocument()
    expect(orderRequests).toHaveLength(0)
  })

  it('auto-dismisses the success sheet after the success delay', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-DISCOUNT',
    }, storage)

    renderApp({ storage })
    await confirmFirstBooking(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()

    await waitFor(
      () => {
        expect(
          screen.queryByRole('heading', { name: 'Booking confirmed' }),
        ).not.toBeInTheDocument()
      },
      { timeout: 2500 },
    )
  })

  it('refreshes the availability overview after a completed booking', async () => {
    const user = userEvent.setup()
    let availabilityRequestCount = 0
    const storage = createMemoryStorage()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-DISCOUNT',
    }, storage)
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

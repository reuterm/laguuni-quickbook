import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

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

describe('booking flow integration', () => {
  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
  })

  it('surfaces payment-required bookings with a continuation link', async () => {
    const user = userEvent.setup()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    })
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutPaymentRequiredFixture),
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
        () => HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT),
      ),
    )

    renderApp()
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Continue to payment' }),
    ).toHaveAttribute(
      'href',
      'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
    )
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

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    })
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutFailureFixture, { status: 200 }),
      ),
    )

    renderApp()
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'could not be completed during checkout',
    )
  })

  it('shows payment required when checkout returns a plain token string', async () => {
    const user = userEvent.setup()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    })
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () => HttpResponse.json(checkoutPaymentRequiredFixture),
      ),
      http.get(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/rest/post/mobilepayhandler/:token.json`,
        () => HttpResponse.json(MOBILEPAY_HANDLER_REDIRECT),
      ),
    )

    renderApp()
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Payment required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Continue to payment' }),
    ).toHaveAttribute(
      'href',
      'https://pay.mobilepay.fi/?token=<captured-via-handler-response>',
    )
  })

  it('allows dismissing a failed booking status', async () => {
    const user = userEvent.setup()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    })
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

    renderApp()
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Dismiss booking status' }),
    )

    expect(
      screen.queryByRole('heading', { name: 'Booking failed' }),
    ).not.toBeInTheDocument()
  })
})

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

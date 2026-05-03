import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

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
      seasonPassCode: 'FIXTURE-VOUCHER-PAYMENT',
    })
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/api/laguuni/fi_FI/orders/:basketToken.json`,
        () =>
          HttpResponse.json({
            order: 'fixture-order-id',
            paymentRequired: true,
            redirectUrl: 'https://shop.laguuniin.fi/pay/fixture-payment-token',
            status: 'ok',
          }),
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
      'https://shop.laguuniin.fi/pay/fixture-payment-token',
    )
  })

  it('shows a failure state when booking details are incomplete', async () => {
    const user = userEvent.setup()

    renderApp()
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Complete your name, phone, and email in Settings before trying to book.',
    )
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
    expect(screen.getByRole('alert')).toHaveTextContent(
      'could not be completed during checkout',
    )
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

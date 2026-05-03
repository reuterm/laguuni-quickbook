import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPersistedAppState,
  saveUserSettings,
} from '../test/persisted-state'
import { renderApp } from '../test/render-app'

describe('App', () => {
  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
  })

  it('loads availability and lets users switch cables', async () => {
    const user = userEvent.setup()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    expect(
      screen.getByRole('heading', { name: 'Book a one-hour cable slot' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(await screen.findAllByText('4/4 free')).not.toHaveLength(0)
    expect(
      await screen.findAllByRole('button', { name: 'Book' }),
    ).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Hietsu' }))

    expect(screen.getByRole('button', { name: 'Hietsu' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      await screen.findByText(
        'No bookable one-hour slots are available for Hietsu in the loaded range.',
      ),
    ).toBeInTheDocument()
  })

  it('books an available slot and surfaces success with a trace id', async () => {
    const user = userEvent.setup()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-VOUCHER-ZERO',
    })

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Trace ID:/)).toHaveTextContent(
      /^Trace ID: [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
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

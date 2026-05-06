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

  it('shows read-only availability and an optional settings path before booking is configured', async () => {
    const user = userEvent.setup()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    expect(
      screen.getByRole('heading', { name: 'Book a one-hour cable slot' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Cable' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pro' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(await screen.findAllByText('4/4')).not.toHaveLength(0)
    expect(
      screen.getByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Add booking details' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Booking details' }),
    ).toBeInTheDocument()
  })

  it('persists the dismissed read-only notice across remounts without enabling booking', async () => {
    const user = userEvent.setup()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    expect(
      screen.getByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss notice' }))

    expect(
      screen.queryByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()

    cleanup()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    expect(
      screen.queryByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()
  })

  it('shows booking actions once the required profile details are saved and lets users switch cables', async () => {
    const user = userEvent.setup()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
    })

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })

    expect(
      await screen.findAllByRole('button', { name: 'Book' }),
    ).not.toHaveLength(0)

    expect(
      screen.queryByRole('tab', { name: 'Hietsu' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Easy' }))

    expect(screen.getByRole('tab', { name: 'Easy' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Pro' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('books an available slot and surfaces success', async () => {
    const user = userEvent.setup()

    saveUserSettings({
      email: 'test@example.com',
      name: 'Test User',
      phone: '+358401234567',
      seasonPassCode: 'FIXTURE-DISCOUNT',
    })

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
    })
    await clickFirstBookButton(user)

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Trace ID:/)).not.toBeInTheDocument()
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

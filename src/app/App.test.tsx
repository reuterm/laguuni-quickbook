import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { READ_ONLY_NOTICE_STORAGE_KEY } from '../features/availability/read-only-notice-storage'
import { createMemoryStorage } from '../test/create-memory-storage'
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
    const storage = createMemoryStorage()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    expect(
      screen.getByRole('heading', { name: 'Book a one-hour cable slot' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Cable' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pro' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(await screen.findAllByText('4')).not.toHaveLength(0)
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
    const storage = createMemoryStorage()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
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
      storage,
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

  it('reads the read-only notice dismissal from injected storage instead of window.localStorage', async () => {
    window.localStorage.setItem(READ_ONLY_NOTICE_STORAGE_KEY, 'true')

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage: createMemoryStorage(),
    })

    expect(
      await screen.findByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).toBeInTheDocument()
  })

  it('writes the read-only notice dismissal to injected storage instead of window.localStorage', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await screen.findByRole('button', { name: 'Dismiss notice' })
    await user.click(screen.getByRole('button', { name: 'Dismiss notice' }))

    await waitFor(() => {
      expect(storage.getItem(READ_ONLY_NOTICE_STORAGE_KEY)).toBe('true')
    })
    expect(window.localStorage.getItem(READ_ONLY_NOTICE_STORAGE_KEY)).toBeNull()
  })

  it('shows booking actions once the required profile details are saved and lets users switch cables', async () => {
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

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    expect(
      await screen.findAllByRole('button', { name: 'Book' }),
    ).not.toHaveLength(0)

    expect(screen.getByRole('tab', { name: 'Hietsu' })).toBeInTheDocument()

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

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await openFirstBookingSheet(user)

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add more' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(
      await screen.findByRole('heading', { name: 'Booking confirmed' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Trace ID:/)).not.toBeInTheDocument()
  })

  it('retains two selected slots after dismissing their review', async () => {
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

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await openFirstBookingSheet(user)
    await user.click(screen.getByRole('button', { name: 'Add more' }))
    await user.click(screen.getByRole('tab', { name: 'Easy' }))

    const secondDay = await screen.findByRole('heading', { name: 'Thu 21 May' })
    const secondDaySection = secondDay.closest('section')
    if (secondDaySection === null) {
      throw new Error('Expected the second Easy cable day group')
    }

    const firstAddButton = within(secondDaySection).getAllByRole('button', {
      name: /^Add /,
    })[0]
    if (!firstAddButton) {
      throw new Error(
        'Expected an Add button in the second Easy cable day group',
      )
    }

    await user.click(firstAddButton)
    await user.click(screen.getByRole('button', { name: 'Review selection' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.getByRole('button', { name: 'Review selection' }),
    ).toBeVisible()
  })

  it('replaces same-cable selections immediately and confirms cross-cable replacements', async () => {
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

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    await openFirstBookingSheet(user)
    await user.click(screen.getByRole('button', { name: 'Add more' }))

    const proSameDayAddButton = screen.getAllByRole('button', {
      name: /^Add 16:00-17:00/,
    })[0]
    if (!proSameDayAddButton) {
      throw new Error('Expected a same-day Pro slot to add')
    }

    await user.click(proSameDayAddButton)

    expect(
      screen.queryByRole('dialog', { name: 'Replace selected slot?' }),
    ).not.toBeInTheDocument()
    expect(
      within(document.body).getByRole(
        'button',
        { hidden: true, name: /^Remove 16:00-17:00/ },
      ),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /^Remove 15:00-16:00/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Easy' }))

    const easySameDay = await screen.findByRole('heading', {
      name: 'Wed 20 May',
    })
    const easySameDaySection = easySameDay.closest('section')
    if (easySameDaySection === null) {
      throw new Error('Expected the first Easy cable day group')
    }

    const easySameDayAddButton = within(easySameDaySection).getAllByRole(
      'button',
      { name: /^Add / },
    )[0]
    if (!easySameDayAddButton) {
      throw new Error('Expected a same-day Easy slot to add')
    }
    await user.click(easySameDayAddButton)

    expect(
      screen.getByRole('dialog', { name: 'Replace selected slot?' }),
    ).toHaveTextContent(/Replace Pro 16:00-17:00 .* with Easy/)
  })

  it('opens the existing booking sheet from a calendar availability badge', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage()

    saveUserSettings(
      {
        availabilityView: 'calendar',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+358401234567',
      },
      storage,
    )

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage,
    })

    const calendarButtons = await screen.findAllByRole('button', {
      name: 'Book 15:00-16:00, 4 spots free',
    })

    const firstCalendarButton = calendarButtons[0]

    if (!firstCalendarButton) {
      throw new Error('Expected at least one calendar booking badge')
    }

    await user.click(firstCalendarButton)

    expect(
      await screen.findByRole('heading', { name: 'Booking details' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()
  })
})

async function openFirstBookingSheet(user: ReturnType<typeof userEvent.setup>) {
  const bookButtons = await screen.findAllByRole('button', {
    name: 'Book',
  })
  const firstBookButton = bookButtons[0]

  if (!firstBookButton) {
    throw new Error('Expected at least one Book button')
  }

  await user.click(firstBookButton)
}

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { getBookingSelectionsPresentation } from '../booking-selections'
import { BookingConfirmPanel } from './BookingConfirmPanel'
import { BookingSheet } from './BookingSheet'
import { BookingSubmittingPanel } from './BookingSubmittingPanel'

const selections = [
  {
    cableId: 'pro' as const,
    date: localDate('2026-05-20'),
    endTime: '16:00',
    startTime: '15:00',
  },
  {
    cableId: 'easy' as const,
    date: localDate('2026-05-22'),
    endTime: '11:00',
    startTime: '10:00',
  },
]

const selectionSummary = getBookingSelectionsPresentation(selections)

afterEach(() => {
  cleanup()
})

describe('BookingSheet', () => {
  it('renders mixed-cable selected slots in the scrollable list', () => {
    render(
      <BookingSheet open onDismiss={() => {}} summary={selectionSummary}>
        <BookingConfirmPanel onConfirm={async () => {}} />
      </BookingSheet>,
    )

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeVisible()
    expect(screen.getByText('2 slots')).toBeVisible()
    expect(screen.getByTestId('booking-selected-slots')).toHaveClass(
      'max-h-[40vh]',
      'overflow-y-auto',
    )
    expect(screen.getByText('Pro')).toBeVisible()
    expect(screen.getByText('Easy')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Confirm booking' }),
    ).toBeEnabled()
  })

  it('does not apply spinner styling to the booking label while submitting', () => {
    render(
      <BookingSheet open onDismiss={() => {}} summary={selectionSummary}>
        <BookingSubmittingPanel selectionsCount={selections.length} />
      </BookingSheet>,
    )

    expect(screen.getByText('Booking')).not.toHaveClass('animate-spin')
  })

  it('does not allow dismissing the sheet while submitting', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <BookingSheet
        dismissible={false}
        open
        onDismiss={onDismiss}
        summary={selectionSummary}
      >
        <BookingSubmittingPanel selectionsCount={selections.length} />
      </BookingSheet>,
    )

    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(onDismiss).not.toHaveBeenCalled()
    expect(
      screen.getByRole('heading', { name: 'Booking in progress' }),
    ).toBeInTheDocument()
  })

  it('dismisses the sheet with the close button when allowed', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <BookingSheet open onDismiss={onDismiss} summary={selectionSummary}>
        <BookingConfirmPanel onConfirm={async () => {}} />
      </BookingSheet>,
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses the sheet when clicking outside while allowed', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <BookingSheet open onDismiss={onDismiss} summary={selectionSummary}>
        <BookingConfirmPanel onConfirm={async () => {}} />
      </BookingSheet>,
    )

    const overlay = document.querySelector('[data-slot="sheet-overlay"]')

    if (!(overlay instanceof HTMLElement)) {
      throw new Error('Expected sheet overlay')
    }

    await user.click(overlay)

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('keeps the sheet open when clicking outside while submitting', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <BookingSheet
        dismissible={false}
        open
        onDismiss={onDismiss}
        summary={selectionSummary}
      >
        <BookingSubmittingPanel selectionsCount={selections.length} />
      </BookingSheet>,
    )

    const overlay = document.querySelector('[data-slot="sheet-overlay"]')

    if (!(overlay instanceof HTMLElement)) {
      throw new Error('Expected sheet overlay')
    }

    await user.click(overlay)

    expect(onDismiss).not.toHaveBeenCalled()
    expect(
      screen.getByRole('heading', { name: 'Booking in progress' }),
    ).toBeInTheDocument()
  })
})

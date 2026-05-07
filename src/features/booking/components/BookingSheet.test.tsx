import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getBookingSelectionPresentation } from '../booking-selection-label'
import { BookingConfirmPanel } from './BookingConfirmPanel'
import { BookingSheet } from './BookingSheet'
import { BookingSubmittingPanel } from './BookingSubmittingPanel'

const selectionSummary = getBookingSelectionPresentation({
  cableId: 'pro',
  date: '2026-05-20',
  endTime: '16:00',
  startTime: '15:00',
})

afterEach(() => {
  cleanup()
})

describe('BookingSheet', () => {
  it('renders a confirmation summary before submission', () => {
    render(
      <BookingSheet onDismiss={() => {}} summary={selectionSummary}>
        <BookingConfirmPanel onConfirm={async () => {}} />
      </BookingSheet>,
    )

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeVisible()
    expect(screen.getByText('Pro')).toBeVisible()
    expect(screen.getByText('15:00-16:00')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Confirm booking' }),
    ).toBeEnabled()
  })

  it('does not apply spinner styling to the booking label while submitting', () => {
    render(
      <BookingSheet onDismiss={() => {}} summary={selectionSummary}>
        <BookingSubmittingPanel selectionLabel={selectionSummary.label} />
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
        onDismiss={onDismiss}
        summary={selectionSummary}
      >
        <BookingSubmittingPanel selectionLabel={selectionSummary.label} />
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
      <BookingSheet onDismiss={onDismiss} summary={selectionSummary}>
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
      <BookingSheet onDismiss={onDismiss} summary={selectionSummary}>
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
        onDismiss={onDismiss}
        summary={selectionSummary}
      >
        <BookingSubmittingPanel selectionLabel={selectionSummary.label} />
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

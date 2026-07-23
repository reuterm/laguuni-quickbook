import { cleanup, render, screen } from '@testing-library/react'
import { CircleCheckBig } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

afterEach(cleanup)

describe('BookingStatePanel', () => {
  it('centers a 32px icon above the state copy', () => {
    render(
      <BookingStatePanel
        body="Booked successfully."
        icon={CircleCheckBig}
        title="Booking confirmed"
        toneClassName={bookingNeutralToneClassName}
      />,
    )

    const icon = screen.getByTestId('booking-state-icon')

    expect(icon).toHaveClass('flex', 'justify-center')
    expect(icon.querySelector('svg')).toHaveClass('size-8')
  })

  it('keeps the text-only layout when no icon is supplied', () => {
    render(
      <BookingStatePanel
        body="Ready to place this booking?"
        title="Confirm booking"
        toneClassName={bookingNeutralToneClassName}
      />,
    )

    expect(screen.queryByTestId('booking-state-icon')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeVisible()
    expect(screen.getByText('Ready to place this booking?')).toBeVisible()
  })
})

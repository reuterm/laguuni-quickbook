import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BookingStatusCard } from './BookingStatusCard'

describe('BookingStatusCard', () => {
  it('does not apply spinner styling to the booking label while submitting', () => {
    render(
      <BookingStatusCard
        selection={{
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        }}
        status="submitting"
        traceId="test-trace-id"
      />,
    )

    expect(screen.getByText('Booking')).not.toHaveClass('animate-spin')
  })
})

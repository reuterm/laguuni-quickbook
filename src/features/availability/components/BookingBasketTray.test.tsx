import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import type { BookingSlotSelection } from '@/domain/booking'
import { BookingBasketTray } from './BookingBasketTray'

describe('BookingBasketTray', () => {
  afterEach(cleanup)

  const first: BookingSlotSelection = {
    cableId: 'pro',
    date: localDate('2026-05-14'),
    endTime: '13:00',
    startTime: '12:00',
  }
  const second: BookingSlotSelection = {
    cableId: 'easy',
    date: localDate('2026-05-13'),
    endTime: '11:00',
    startTime: '10:00',
  }

  it('renders one count CTA and delegates review', async () => {
    const onReview = vi.fn()
    const user = userEvent.setup()

    render(
      <BookingBasketTray onReview={onReview} selections={[first, second]} />,
    )

    await user.click(screen.getByRole('button', { name: '2 slots selected' }))
    expect(onReview).toHaveBeenCalledOnce()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear selection' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Review selected slots' }),
    ).not.toBeInTheDocument()
  })

  it('uses singular count copy and returns nothing when empty', () => {
    const { rerender } = render(
      <BookingBasketTray onReview={vi.fn()} selections={[]} />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<BookingBasketTray onReview={vi.fn()} selections={[first]} />)
    expect(
      screen.getByRole('button', { name: '1 slot selected' }),
    ).toBeInTheDocument()
  })
})

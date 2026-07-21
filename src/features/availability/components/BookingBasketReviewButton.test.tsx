import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BookingSlotSelection } from '@/domain/booking'
import { localDate } from '../../../../tests/local-date'
import { BookingBasketReviewButton } from './BookingBasketReviewButton'

describe('BookingBasketReviewButton', () => {
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

  it('renders a floating review pill and delegates review', async () => {
    const onReview = vi.fn()
    const user = userEvent.setup()

    render(
      <BookingBasketReviewButton
        onReview={onReview}
        selections={[first, second]}
      />,
    )

    const button = screen.getByRole('button', {
      name: 'Review selection 2 selected slots',
    })

    expect(button).toHaveTextContent('Review selection')
    expect(button).toHaveClass(
      'fixed',
      'bottom-[calc(env(safe-area-inset-bottom)+1rem)]',
    )
    await user.click(button)
    expect(onReview).toHaveBeenCalledOnce()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear selection' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Review selected slots' }),
    ).not.toBeInTheDocument()
  })

  it('uses a singular accessible label and returns nothing when empty', () => {
    const { rerender } = render(
      <BookingBasketReviewButton onReview={vi.fn()} selections={[]} />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(
      <BookingBasketReviewButton onReview={vi.fn()} selections={[first]} />,
    )
    expect(
      screen.getByRole('button', { name: 'Review selection 1 selected slot' }),
    ).toBeInTheDocument()
  })
})

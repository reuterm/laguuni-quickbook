import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { BookingBasketTray } from './BookingBasketTray'

describe('BookingBasketTray', () => {
  afterEach(cleanup)

  it('shows selections chronologically and delegates review', async () => {
    const onClear = vi.fn()
    const onReview = vi.fn()
    const user = userEvent.setup()

    render(
      <BookingBasketTray
        selections={[
          {
            cableId: 'pro',
            date: localDate('2026-05-14'),
            endTime: '13:00',
            startTime: '12:00',
          },
          {
            cableId: 'easy',
            date: localDate('2026-05-13'),
            endTime: '11:00',
            startTime: '10:00',
          },
        ]}
        onClear={onClear}
        onReview={onReview}
      />,
    )

    expect(screen.getByText('2 slots selected')).toBeInTheDocument()
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Wed 13 May'),
      expect.stringContaining('Thu 14 May'),
    ])

    await user.click(
      screen.getByRole('button', { name: 'Review selected slots' }),
    )

    expect(onReview).toHaveBeenCalledOnce()
  })

  it('renders nothing without selections', () => {
    const { container } = render(
      <BookingBasketTray
        selections={[]}
        onClear={vi.fn()}
        onReview={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('delegates clearing', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()

    render(
      <BookingBasketTray
        selections={[
          {
            cableId: 'pro',
            date: localDate('2026-05-14'),
            endTime: '13:00',
            startTime: '12:00',
          },
        ]}
        onClear={onClear}
        onReview={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onClear).toHaveBeenCalledOnce()
  })
})

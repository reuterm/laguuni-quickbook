import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BookingConfirmPanel } from './BookingConfirmPanel'

afterEach(() => {
  cleanup()
})

describe('BookingConfirmPanel', () => {
  it('renders no secondary action when one is not provided', () => {
    render(<BookingConfirmPanel onConfirm={async () => {}} />)

    expect(screen.queryAllByRole('button')).toHaveLength(1)
  })

  it('renders and invokes a full-width secondary action after confirm', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <BookingConfirmPanel
        onConfirm={async () => {}}
        secondaryAction={{ label: 'Add more', onClick }}
      />,
    )

    const buttons = screen.getAllByRole('button')

    expect(buttons.map((button) => button.textContent)).toEqual([
      'Confirm booking',
      'Add more',
    ])
    const secondaryButton = buttons[1]
    expect(secondaryButton).toBeDefined()
    if (!secondaryButton) {
      throw new Error('Expected secondary action button')
    }

    expect(secondaryButton).toHaveClass('bg-secondary/90', 'w-full')

    await user.click(secondaryButton)

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('invokes the confirm action', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(async () => {})

    render(<BookingConfirmPanel onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })
})

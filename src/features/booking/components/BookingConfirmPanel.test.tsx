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

  it('renders and invokes Add more', async () => {
    const user = userEvent.setup()
    const onAddMore = vi.fn()

    render(
      <BookingConfirmPanel
        onConfirm={async () => {}}
        onAddMore={onAddMore}
      />,
    )

    const buttons = screen.getAllByRole('button')

    expect(buttons.map((button) => button.textContent)).toEqual([
      'Confirm booking',
      'Add more',
    ])
    const addMoreButton = buttons[1]
    expect(addMoreButton).toBeDefined()
    if (!addMoreButton) {
      throw new Error('Expected Add more button')
    }

    expect(addMoreButton).toHaveClass('bg-secondary/90', 'w-full')

    await user.click(addMoreButton)

    expect(onAddMore).toHaveBeenCalledOnce()
  })

  it('renders and invokes Clear selection', async () => {
    const user = userEvent.setup()
    const onClearSelection = vi.fn()

    render(
      <BookingConfirmPanel
        onClearSelection={onClearSelection}
        onConfirm={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onClearSelection).toHaveBeenCalledOnce()
  })

  it('invokes the confirm action', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(async () => {})

    render(<BookingConfirmPanel onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })
})

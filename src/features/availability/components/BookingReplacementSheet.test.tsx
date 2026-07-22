import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { BookingReplacementSheet } from './BookingReplacementSheet'

const pendingReplacement = {
  current: {
    cableId: 'pro' as const,
    date: localDate('2026-05-14'),
    endTime: '16:00',
    startTime: '15:00',
  },
  proposed: {
    cableId: 'easy' as const,
    date: localDate('2026-05-14'),
    endTime: '18:00',
    startTime: '17:00',
  },
}

afterEach(cleanup)

describe('BookingReplacementSheet', () => {
  it('shows the replacement details and delegates both explicit choices', async () => {
    const user = userEvent.setup()
    const onKeepCurrentSelection = vi.fn()
    const onReplace = vi.fn()

    render(
      <BookingReplacementSheet
        pendingReplacement={pendingReplacement}
        onKeepCurrentSelection={onKeepCurrentSelection}
        onReplace={onReplace}
      />,
    )

    expect(screen.getByRole('dialog')).toHaveTextContent(
      /Replace Pro .* with Easy/,
    )

    await user.click(screen.getByRole('button', { name: 'Replace' }))
    expect(onReplace).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Keep current' }))
    expect(onKeepCurrentSelection).toHaveBeenCalledOnce()
  })

  it('keeps the current selection when dismissed with Escape', async () => {
    const user = userEvent.setup()
    const onKeepCurrentSelection = vi.fn()
    const onReplace = vi.fn()

    render(
      <BookingReplacementSheet
        pendingReplacement={pendingReplacement}
        onKeepCurrentSelection={onKeepCurrentSelection}
        onReplace={onReplace}
      />,
    )

    await user.keyboard('{Escape}')

    expect(onKeepCurrentSelection).toHaveBeenCalledOnce()
    expect(onReplace).not.toHaveBeenCalled()
  })

  it('keeps the current selection when dismissed with the close button', async () => {
    const user = userEvent.setup()
    const onKeepCurrentSelection = vi.fn()
    const onReplace = vi.fn()

    render(
      <BookingReplacementSheet
        pendingReplacement={pendingReplacement}
        onKeepCurrentSelection={onKeepCurrentSelection}
        onReplace={onReplace}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(onKeepCurrentSelection).toHaveBeenCalledOnce()
    expect(onReplace).not.toHaveBeenCalled()
  })
})

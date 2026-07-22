import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { AvailabilityCapacityChip } from './availability-badge'

const slot = {
  endTime: '16:00',
  freeCapacity: 4,
  id: '2026-05-14-900',
  selection: {
    cableId: 'pro' as const,
    date: localDate('2026-05-14'),
    endTime: '16:00',
    startTime: '15:00',
  },
  startTime: '15:00',
  totalCapacity: 4,
}

describe('AvailabilityCapacityChip', () => {
  afterEach(cleanup)

  it('exposes selected interactive state', () => {
    render(
      <AvailabilityCapacityChip
        disabled={false}
        onClick={vi.fn()}
        pressed
        slot={slot}
      />,
    )

    const chip = screen.getByRole('button', { name: 'Book slot' })

    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(chip).toHaveClass('border-primary')
  })

  it('renders static chips without button semantics', () => {
    render(
      <AvailabilityCapacityChip disabled={false} pressed={false} slot={slot} />,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})

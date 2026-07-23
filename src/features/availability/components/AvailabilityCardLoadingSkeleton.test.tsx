import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AvailabilityCardLoadingSkeleton } from './AvailabilityCardLoadingSkeleton'

describe('AvailabilityCardLoadingSkeleton', () => {
  it('renders the requested number of card skeleton groups', () => {
    render(<AvailabilityCardLoadingSkeleton skeletonCount={2} />)

    expect(screen.getAllByTestId('availability-card-skeleton')).toHaveLength(2)
  })
})

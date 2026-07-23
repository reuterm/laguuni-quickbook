import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AvailabilityLoadingSkeleton } from './AvailabilityLoadingSkeleton'
import type { AvailabilityOverviewContentModel } from './availability-overview-content-model'

describe('AvailabilityLoadingSkeleton', () => {
  it('renders card skeletons when cards are the active presentation', () => {
    render(
      <AvailabilityLoadingSkeleton
        availabilityReferenceDate={new Date('2026-05-11T12:00:00')}
        contentModel={createContentModel(false)}
        skeletonCount={2}
      />,
    )

    expect(screen.getAllByTestId('availability-card-skeleton')).toHaveLength(2)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders calendar skeleton weeks when calendar is the active presentation', () => {
    render(
      <AvailabilityLoadingSkeleton
        availabilityReferenceDate={new Date('2026-05-11T12:00:00')}
        contentModel={createContentModel(true)}
        skeletonCount={2}
      />,
    )

    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(
      screen.queryByTestId('availability-card-skeleton'),
    ).not.toBeInTheDocument()
  })
})

function createContentModel(
  isCalendarView: boolean,
): AvailabilityOverviewContentModel {
  return {
    hasAppendError: false,
    hasLoadedDayGroups: false,
    hasRenderedAvailability: false,
    isCalendarView,
    renderedCardDayGroups: [],
    renderedDayGroups: [],
  }
}

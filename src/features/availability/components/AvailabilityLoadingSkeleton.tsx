import type { AvailabilityOverviewContentModel } from './availability-overview-content-model'
import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'
import { AvailabilityCardLoadingSkeleton } from './AvailabilityCardLoadingSkeleton'

type AvailabilityLoadingSkeletonProps = {
  availabilityReferenceDate?: Date | undefined
  contentModel: AvailabilityOverviewContentModel
  skeletonCardCount: number
  skeletonWeekCount: number
}

export function AvailabilityLoadingSkeleton({
  availabilityReferenceDate,
  contentModel,
  skeletonCardCount,
  skeletonWeekCount,
}: AvailabilityLoadingSkeletonProps) {
  if (contentModel.isCalendarView) {
    return (
      <AvailabilityCalendarLoadingGrid
        availabilityReferenceDate={availabilityReferenceDate}
        skeletonWeekCount={skeletonWeekCount}
      />
    )
  }

  return <AvailabilityCardLoadingSkeleton skeletonCount={skeletonCardCount} />
}

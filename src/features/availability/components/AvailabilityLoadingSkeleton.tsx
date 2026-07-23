import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'
import { AvailabilityCardLoadingSkeleton } from './AvailabilityCardLoadingSkeleton'
import type { AvailabilityOverviewContentModel } from './availability-overview-content-model'

type AvailabilityLoadingSkeletonProps = {
  availabilityReferenceDate?: Date | undefined
  contentModel: AvailabilityOverviewContentModel
  skeletonCount: number
}

export function AvailabilityLoadingSkeleton({
  availabilityReferenceDate,
  contentModel,
  skeletonCount,
}: AvailabilityLoadingSkeletonProps) {
  if (contentModel.isCalendarView) {
    return (
      <AvailabilityCalendarLoadingGrid
        availabilityReferenceDate={availabilityReferenceDate}
        skeletonWeekCount={skeletonCount}
      />
    )
  }

  return <AvailabilityCardLoadingSkeleton skeletonCount={skeletonCount} />
}

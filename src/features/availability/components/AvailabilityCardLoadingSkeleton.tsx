import { Skeleton } from '@/components/ui/skeleton'
import { panelSurfaceClassName } from '@/components/ui/styles'
import { cn } from '@/lib/utils'

const cardSkeletonKeys = ['first', 'second', 'third']

type AvailabilityCardLoadingSkeletonProps = {
  skeletonCount: number
}

export function AvailabilityCardLoadingSkeleton({
  skeletonCount,
}: AvailabilityCardLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {cardSkeletonKeys.slice(0, skeletonCount).map((key) => (
        <div
          key={key}
          data-testid="availability-card-skeleton"
          className={cn(panelSurfaceClassName, 'overflow-hidden p-4 sm:p-5')}
        >
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((slotIndex) => (
              <Skeleton key={slotIndex} className="h-18 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

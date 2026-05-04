import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  panelSurfaceClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'

import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

type AvailabilityOverviewContentProps = {
  activeCableLabel: string
  availabilityState: AvailabilityState
} & AvailabilityBookingActionProps

export function AvailabilityOverviewContent({
  activeCableLabel,
  availabilityState,
  ...bookingActionProps
}: AvailabilityOverviewContentProps) {
  if (availabilityState.status === 'loading') {
    return (
      <div role="status" aria-live="polite" className="grid gap-6">
        <p className="sr-only">Loading availability…</p>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(panelSurfaceClassName, 'overflow-hidden p-4 sm:p-5')}
          >
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-18 w-full rounded-xl" />
              <Skeleton className="h-18 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (availabilityState.status === 'error') {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>Availability unavailable</AlertTitle>
        <AlertDescription>{availabilityState.message}</AlertDescription>
      </Alert>
    )
  }

  if (availabilityState.dayGroups.length === 0) {
    return (
      <Alert role="status" className={subtleSurfaceBackgroundClassName}>
        <AlertTitle>No bookable slots in range</AlertTitle>
        <AlertDescription>
          No bookable one-hour slots are available for {activeCableLabel} in the
          loaded range.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <AvailabilityDayGroups
      dayGroups={availabilityState.dayGroups}
      {...bookingActionProps}
    />
  )
}

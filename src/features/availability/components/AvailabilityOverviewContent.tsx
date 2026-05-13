import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  eyebrowClassName,
  panelSurfaceClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'

import type { AvailabilityState } from '../use-availability-overview'
import {
  AvailabilityDayGroups,
  availabilityDayAutoFitGridStyle,
} from './AvailabilityDayGroups'
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
  const isRefreshing = availabilityState.status === 'refreshing'

  if (availabilityState.status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="grid items-start"
        style={availabilityDayAutoFitGridStyle}
      >
        <p className="sr-only">Loading availability…</p>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
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
      <div className="space-y-3">
        {isRefreshing ? (
          <p className={eyebrowClassName} role="status" aria-live="polite">
            Refreshing availability…
          </p>
        ) : null}

        <Alert role="status" className={subtleSurfaceBackgroundClassName}>
          <AlertTitle>No bookable slots in range</AlertTitle>
          <AlertDescription>
            No bookable one-hour slots are available for {activeCableLabel} in
            the loaded range.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isRefreshing ? (
        <p className={eyebrowClassName} role="status" aria-live="polite">
          Refreshing availability…
        </p>
      ) : null}

      <AvailabilityDayGroups
        dayGroups={availabilityState.dayGroups}
        {...bookingActionProps}
      />
    </div>
  )
}

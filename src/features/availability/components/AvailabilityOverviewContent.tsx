import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

import type { BookingSlotSelection } from '../../../domain/booking'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'

type AvailabilityOverviewContentProps = {
  activeCableLabel: string
  availabilityState: AvailabilityState
  onBookSelection?: ((selection: BookingSlotSelection) => void) | undefined
  showBookingActions?: boolean
}

export function AvailabilityOverviewContent({
  activeCableLabel,
  availabilityState,
  onBookSelection,
  showBookingActions = true,
}: AvailabilityOverviewContentProps) {
  if (availabilityState.status === 'loading') {
    return (
      <div role="status" aria-live="polite" className="grid gap-3">
        <p className="sr-only">Loading availability…</p>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="rounded-3xl border border-border/70 bg-muted/30 p-5"
          >
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (availabilityState.status === 'error') {
    return (
      <Alert variant="destructive" role="alert" className="rounded-3xl">
        <AlertTitle>Availability unavailable</AlertTitle>
        <AlertDescription>{availabilityState.message}</AlertDescription>
      </Alert>
    )
  }

  if (availabilityState.dayGroups.length === 0) {
    return (
      <Alert role="status" className="rounded-3xl border-border/70 bg-muted/30">
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
      onBookSelection={onBookSelection}
      showBookingActions={showBookingActions}
    />
  )
}

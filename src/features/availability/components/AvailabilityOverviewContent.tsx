import { useAvailabilityReferenceDate } from '@/app/providers'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  eyebrowClassName,
  panelSurfaceClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'

import { useUserSettings } from '../../settings/use-user-settings'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
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
  const { settings } = useUserSettings()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const isRefreshing = availabilityState.status === 'refreshing'
  const isCalendarView = settings.availabilityView === 'calendar'

  if (availabilityState.status === 'loading') {
    if (isCalendarView) {
      return <AvailabilityCalendarLoadingState />
    }

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

      {isCalendarView ? (
        <AvailabilityCalendarGrid
          availabilityReferenceDate={availabilityReferenceDate}
          dayGroups={availabilityState.dayGroups}
          {...bookingActionProps}
        />
      ) : (
        <AvailabilityDayGroups
          dayGroups={availabilityState.dayGroups}
          {...bookingActionProps}
        />
      )}
    </div>
  )
}

function AvailabilityCalendarLoadingState() {
  const loadingWeekKeys = ['week-1', 'week-2']
  const loadingDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const loadingTimeKeys = ['time-1', 'time-2', 'time-3', 'time-4', 'time-5']

  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="sr-only">Loading availability…</p>

      {loadingWeekKeys.map((weekKey) => (
        <div
          key={weekKey}
          className={cn(panelSurfaceClassName, 'overflow-hidden')}
        >
          <div className="border-b border-border/70 px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[54rem] p-3 sm:p-4">
              <div className="grid grid-cols-[5rem_repeat(7,minmax(7rem,1fr))] gap-px rounded-2xl bg-border/70 p-px">
                <Skeleton className="h-14 rounded-l-[calc(var(--radius-lg)-1px)] bg-card/70" />
                {loadingDayKeys.map((dayKey) => (
                  <Skeleton
                    key={`${weekKey}-${dayKey}-header`}
                    className="h-14 rounded-none bg-card/70 last:rounded-r-[calc(var(--radius-lg)-1px)]"
                  />
                ))}

                {loadingTimeKeys.flatMap((timeKey) => [
                  <Skeleton
                    key={`${weekKey}-${timeKey}-time`}
                    className="h-12 rounded-none bg-card/55"
                  />,
                  ...loadingDayKeys.map((dayKey) => (
                    <div
                      key={`${weekKey}-${timeKey}-${dayKey}`}
                      className="flex h-12 items-center justify-center bg-card/35"
                    >
                      <Skeleton className="h-8 w-12 rounded-full" />
                    </div>
                  )),
                ])}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

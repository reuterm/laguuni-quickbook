import { useAvailabilityReferenceDate } from '@/app/providers'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTitle } from '@/components/ui/alert-title'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  eyebrowClassName,
  panelSurfaceClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { BookingSlotSelection } from '../../../domain/booking'
import { useUserSettings } from '../../settings/use-user-settings'
import { AVAILABILITY_CALENDAR_BREAKPOINT_QUERY } from '../availability-calendar'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'
import type { AvailabilityBookingActionProps } from './availability-booking-action'
import { getAvailabilityOverviewContentModel } from './availability-overview-content-model'
import { useAvailabilityAutoLoad } from './use-availability-auto-load'

type AvailabilityOverviewContentProps = {
  activeCableLabel: string
  availabilityState: AvailabilityState
  isOffline?: boolean
  onLoadMore: () => Promise<void>
  isSelected?: ((selection: BookingSlotSelection) => boolean) | undefined
  onAddSelection?: ((selection: BookingSlotSelection) => void) | undefined
  onRemoveSelection?: ((selection: BookingSlotSelection) => void) | undefined
} & AvailabilityBookingActionProps

export function AvailabilityOverviewContent({
  activeCableLabel,
  availabilityState,
  isOffline = false,
  onLoadMore,
  ...bookingActionProps
}: AvailabilityOverviewContentProps) {
  const { settings } = useUserSettings()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const isCalendarBreakpoint = useMediaQuery(
    AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  )
  const contentModel = getAvailabilityOverviewContentModel(
    availabilityState,
    settings.availabilityView,
    isCalendarBreakpoint,
  )
  const canLoadMore =
    availabilityState.status === 'ready' && availabilityState.canLoadMore
  const canAutoLoadMore = canLoadMore && !contentModel.hasAppendError

  const { loadMoreTriggerRef } = useAvailabilityAutoLoad({
    canAutoLoadMore,
    hasLoadedDayGroups: contentModel.hasLoadedDayGroups,
    isLoadingMore: availabilityState.isLoadingMore,
    loadedDayGroupCount: contentModel.renderedDayGroups.length,
    onLoadMore,
  })

  if (isOffline) {
    return (
      <Alert
        role="status"
        className={cn(subtleSurfaceBackgroundClassName, 'text-center')}
      >
        <AlertTitle className="text-center">
          Reconnect to load availability
        </AlertTitle>
        <AlertDescription className="text-center">
          Saved settings stay available on this device, but availability and
          booking for {activeCableLabel} need an internet connection.
        </AlertDescription>
      </Alert>
    )
  }

  if (availabilityState.status === 'loading') {
    if (contentModel.isCalendarView) {
      return (
        <AvailabilityCalendarLoadingGrid
          availabilityReferenceDate={availabilityReferenceDate}
        />
      )
    }

    return (
      <output aria-live="polite" className="space-y-6">
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
      </output>
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

  return (
    <div className="space-y-3">
      {contentModel.isRefreshing ? (
        <p className={eyebrowClassName} role="status" aria-live="polite">
          Refreshing availability…
        </p>
      ) : null}

      {contentModel.hasRenderedAvailability ? (
        contentModel.isCalendarView ? (
          <AvailabilityCalendarGrid
            availabilityReferenceDate={availabilityReferenceDate}
            dayGroups={contentModel.renderedDayGroups}
            {...bookingActionProps}
          />
        ) : (
          <AvailabilityDayGroups
            dayGroups={contentModel.renderedCardDayGroups}
            {...bookingActionProps}
          />
        )
      ) : (
        <Alert role="status" className={subtleSurfaceBackgroundClassName}>
          <AlertTitle>No bookable slots in range</AlertTitle>
          <AlertDescription>
            No bookable one-hour slots are available for {activeCableLabel} in
            the loaded range.
          </AlertDescription>
        </Alert>
      )}

      {availabilityState.appendErrorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Could not load next week</AlertTitle>
          <AlertDescription>
            {availabilityState.appendErrorMessage}
          </AlertDescription>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                void onLoadMore()
              }}
            >
              Retry
            </Button>
          </div>
        </Alert>
      ) : null}

      {availabilityState.isLoadingMore ? (
        <output aria-live="polite" className="flex justify-center px-1 py-2">
          <Spinner className="size-5" />
          <span className="sr-only">Loading another week…</span>
        </output>
      ) : null}

      <div ref={loadMoreTriggerRef} aria-hidden="true" className="h-1 w-full" />
    </div>
  )
}

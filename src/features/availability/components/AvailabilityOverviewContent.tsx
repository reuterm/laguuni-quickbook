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
import { useUserSettings } from '../../settings/use-user-settings'
import { AVAILABILITY_CALENDAR_BREAKPOINT_QUERY } from '../availability-calendar'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'
import type { AvailabilityBookingActionProps } from './availability-booking-action'
import { getAvailabilityOverviewContentModel } from './availability-overview-content-model'
import type { BookingBasketProps } from './booking-basket-props'
import { useAvailabilityAutoLoad } from './use-availability-auto-load'

type AvailabilityOverviewContentProps = {
  activeCableLabel: string
  availabilityState: AvailabilityState
  basket: BookingBasketProps
  isOffline?: boolean
  onLoadMore: () => Promise<void>
} & AvailabilityBookingActionProps

export function AvailabilityOverviewContent({
  activeCableLabel,
  availabilityState,
  basket,
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

  const appendErrorMessage = availabilityState.appendErrorMessage
  const refreshNotice = contentModel.isRefreshing ? (
    <p className={eyebrowClassName} role="status" aria-live="polite">
      Refreshing availability…
    </p>
  ) : null

  function renderAvailability() {
    if (contentModel.hasRenderedAvailability) {
      return (
        <div
          data-testid="availability-content"
          className={cn(basket.selections.length > 0 && 'pb-24')}
        >
          {contentModel.isCalendarView ? (
            <AvailabilityCalendarGrid
              availabilityReferenceDate={availabilityReferenceDate}
              basket={basket}
              dayGroups={contentModel.renderedDayGroups}
              {...bookingActionProps}
            />
          ) : (
            <AvailabilityDayGroups
              basket={basket}
              dayGroups={contentModel.renderedCardDayGroups}
              {...bookingActionProps}
            />
          )}
        </div>
      )
    }

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

  function renderAppendError() {
    if (!availabilityState.appendErrorMessage) {
      return null
    }

    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>Could not load next week</AlertTitle>
        <AlertDescription>{appendErrorMessage}</AlertDescription>
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
    )
  }

  function renderLoadingMore() {
    if (!availabilityState.isLoadingMore) {
      return null
    }

    return (
      <output aria-live="polite" className="flex justify-center px-1 py-2">
        <Spinner className="size-5" />
        <span className="sr-only">Loading another week…</span>
      </output>
    )
  }

  return (
    <div className="space-y-3">
      {refreshNotice}
      {renderAvailability()}
      {renderAppendError()}
      {renderLoadingMore()}

      <div ref={loadMoreTriggerRef} aria-hidden="true" className="h-1 w-full" />
    </div>
  )
}

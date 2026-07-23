import { useAvailabilityReferenceDate } from '@/app/providers'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTitle } from '@/components/ui/alert-title'
import { Button } from '@/components/ui/button'
import { subtleSurfaceBackgroundClassName } from '@/components/ui/styles'
import { addCalendarDays } from '@/lib/date'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { useUserSettings } from '../../settings/use-user-settings'
import { AVAILABILITY_CALENDAR_BREAKPOINT_QUERY } from '../availability-calendar'
import { AVAILABILITY_WEEK_DAY_COUNT } from '../availability-service'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'
import { AvailabilityLoadingSkeleton } from './AvailabilityLoadingSkeleton'
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
    return (
      <AvailabilityLoadingSkeleton
        availabilityReferenceDate={availabilityReferenceDate}
        contentModel={contentModel}
        skeletonCount={availabilityState.skeletonWeekCount}
      />
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
    if (!appendErrorMessage) {
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

    const lastWeekPage = availabilityState.weekPages.at(-1)

    return (
      <AvailabilityLoadingSkeleton
        availabilityReferenceDate={
          lastWeekPage
            ? addCalendarDays(
                lastWeekPage.weekStartDate,
                AVAILABILITY_WEEK_DAY_COUNT,
              )
            : availabilityReferenceDate
        }
        contentModel={contentModel}
        skeletonCount={1}
      />
    )
  }

  return (
    <div className="space-y-3">
      {renderAvailability()}
      {renderAppendError()}
      {renderLoadingMore()}

      <div ref={loadMoreTriggerRef} aria-hidden="true" className="h-1 w-full" />
    </div>
  )
}

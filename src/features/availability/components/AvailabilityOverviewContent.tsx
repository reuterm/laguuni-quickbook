import { useCallback, useEffect, useRef } from 'react'

import { useAvailabilityReferenceDate } from '@/app/providers'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  eyebrowClassName,
  panelSurfaceClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'

import { useUserSettings } from '../../settings/use-user-settings'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'
import {
  AvailabilityDayGroups,
  availabilityDayAutoFitGridStyle,
} from './AvailabilityDayGroups'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

const LOAD_MORE_TRIGGER_ROOT_MARGIN_PX = 320
type AutoLoadSource = 'intersection' | 'no-scroll' | 'scroll'

type AvailabilityOverviewContentProps = {
  activeCableLabel: string
  availabilityState: AvailabilityState
  onLoadMore: () => Promise<void>
} & AvailabilityBookingActionProps

export function AvailabilityOverviewContent({
  activeCableLabel,
  availabilityState,
  onLoadMore,
  ...bookingActionProps
}: AvailabilityOverviewContentProps) {
  const { settings } = useUserSettings()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const hasUserScrolledRef = useRef(false)
  const lastAutoLoadScrollYRef = useRef(-1)
  const lastNoScrollAttemptKeyRef = useRef('')
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const isRefreshing = availabilityState.status === 'refreshing'
  const isCalendarView = settings.availabilityView === 'calendar'
  const canLoadMore =
    availabilityState.status === 'ready' && availabilityState.canLoadMore
  const hasLoadedDayGroups =
    availabilityState.status === 'ready' ||
    availabilityState.status === 'refreshing'
  const hasAppendError =
    hasLoadedDayGroups && availabilityState.appendErrorMessage !== null
  const canAutoLoadMore = canLoadMore && !hasAppendError
  const renderedDayGroups = hasLoadedDayGroups
    ? availabilityState.dayGroups
    : []
  const renderedCardDayGroups = renderedDayGroups.filter(
    (dayGroup) => dayGroup.slots.length > 0,
  )
  const hasRenderedAvailability = renderedDayGroups.some(
    (dayGroup) => dayGroup.slots.length > 0,
  )

  const canAttemptAutoLoad =
    hasLoadedDayGroups && canAutoLoadMore && !availabilityState.isLoadingMore

  const attemptAutoLoad = useCallback(
    (source: AutoLoadSource) => {
      if (!canAttemptAutoLoad) {
        return
      }

      if (source === 'no-scroll') {
        if (hasScrolled(hasUserScrolledRef.current) || isPageScrollable()) {
          return
        }

        const autoLoadKey = `${renderedDayGroups.length}:${window.innerHeight}`

        if (lastNoScrollAttemptKeyRef.current === autoLoadKey) {
          return
        }

        lastNoScrollAttemptKeyRef.current = autoLoadKey
        void onLoadMore()
        return
      }

      if (
        !hasScrolled(hasUserScrolledRef.current) ||
        !isTriggerWithinLoadRange(loadMoreTriggerRef.current)
      ) {
        return
      }

      if (window.scrollY <= lastAutoLoadScrollYRef.current) {
        return
      }

      lastAutoLoadScrollYRef.current = window.scrollY
      void onLoadMore()
    },
    [canAttemptAutoLoad, onLoadMore, renderedDayGroups.length],
  )

  useEffect(() => {
    if (!hasLoadedDayGroups) {
      hasUserScrolledRef.current = false
      lastAutoLoadScrollYRef.current = -1
      lastNoScrollAttemptKeyRef.current = ''
      return undefined
    }

    if (!canAttemptAutoLoad) {
      return undefined
    }

    const handleScroll = () => {
      if (window.scrollY > 0) {
        hasUserScrolledRef.current = true
      }

      attemptAutoLoad('scroll')
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    if (typeof IntersectionObserver !== 'function') {
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }

    const loadMoreTrigger = loadMoreTriggerRef.current

    if (!(loadMoreTrigger instanceof HTMLDivElement)) {
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return
        }

        attemptAutoLoad('intersection')
      },
      {
        root: null,
        rootMargin: `0px 0px ${LOAD_MORE_TRIGGER_ROOT_MARGIN_PX}px 0px`,
      },
    )

    intersectionObserver.observe(loadMoreTrigger)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      intersectionObserver.disconnect()
    }
  }, [attemptAutoLoad, canAttemptAutoLoad, hasLoadedDayGroups])

  useEffect(() => {
    if (!hasLoadedDayGroups) {
      lastNoScrollAttemptKeyRef.current = ''
      return undefined
    }

    if (!canAttemptAutoLoad) {
      return undefined
    }

    if (hasScrolled(hasUserScrolledRef.current)) {
      return undefined
    }

    let timeoutId = 0

    const scheduleAutoLoadWithoutScroll = () => {
      window.clearTimeout(timeoutId)
      // Re-check after layout settles so tall viewports can bootstrap into a scrollable page.
      timeoutId = window.setTimeout(() => {
        attemptAutoLoad('no-scroll')
      }, 0)
    }

    scheduleAutoLoadWithoutScroll()
    window.addEventListener('resize', scheduleAutoLoadWithoutScroll)

    return () => {
      window.removeEventListener('resize', scheduleAutoLoadWithoutScroll)
      window.clearTimeout(timeoutId)
    }
  }, [attemptAutoLoad, canAttemptAutoLoad, hasLoadedDayGroups])

  if (availabilityState.status === 'loading') {
    if (isCalendarView) {
      return (
        <AvailabilityCalendarLoadingGrid
          availabilityReferenceDate={availabilityReferenceDate}
        />
      )
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

  return (
    <div className="space-y-3">
      {isRefreshing ? (
        <p className={eyebrowClassName} role="status" aria-live="polite">
          Refreshing availability…
        </p>
      ) : null}

      {hasRenderedAvailability ? (
        isCalendarView ? (
          <AvailabilityCalendarGrid
            availabilityReferenceDate={availabilityReferenceDate}
            dayGroups={renderedDayGroups}
            {...bookingActionProps}
          />
        ) : (
          <AvailabilityDayGroups
            dayGroups={renderedCardDayGroups}
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
        <div
          role="status"
          aria-live="polite"
          className="flex justify-center px-1 py-2"
        >
          <Spinner className="size-5" />
          <span className="sr-only">Loading another week…</span>
        </div>
      ) : null}

      <div ref={loadMoreTriggerRef} aria-hidden="true" className="h-1 w-full" />
    </div>
  )
}

function getPageScrollHeight() {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  )
}

function hasScrolled(hasUserScrolled: boolean) {
  return hasUserScrolled || window.scrollY > 0
}

function isPageScrollable() {
  return getPageScrollHeight() > window.innerHeight
}

function isTriggerWithinLoadRange(loadMoreTrigger: HTMLDivElement | null) {
  if (!(loadMoreTrigger instanceof HTMLDivElement)) {
    return false
  }

  return (
    loadMoreTrigger.getBoundingClientRect().top <=
    window.innerHeight + LOAD_MORE_TRIGGER_ROOT_MARGIN_PX
  )
}

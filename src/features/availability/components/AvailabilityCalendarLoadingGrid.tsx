import { Skeleton } from '@/components/ui/skeleton'
import {
  subtleDividerClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'

import {
  AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  formatAvailabilityWeekLabel,
  formatDateKey,
  getAvailabilityWeekStartDate,
  listCalendarSkeletonWeeks,
  listVisibleWeekdayIndices,
} from '../availability-calendar'
import { AVAILABILITY_INITIAL_RANGE_DAY_COUNT } from '../availability-service'
import { AvailabilityCalendarTableFrame } from './AvailabilityCalendarTableFrame'
import { availabilityCalendarColumnClassNames } from './availability-calendar-ui'

type AvailabilityCalendarLoadingGridProps = {
  availabilityReferenceDate?: Date | undefined
}

export function AvailabilityCalendarLoadingGrid({
  availabilityReferenceDate,
}: AvailabilityCalendarLoadingGridProps) {
  const rangeStartDate = getAvailabilityWeekStartDate(
    availabilityReferenceDate ?? new Date(),
  )
  const showFullWeekColumns = useMediaQuery(
    AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  )
  const loadingWeekStartDates = listCalendarSkeletonWeeks(
    rangeStartDate,
    AVAILABILITY_INITIAL_RANGE_DAY_COUNT,
  )

  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="sr-only">Loading availability…</p>

      {loadingWeekStartDates.map((weekStartDate) => (
        <AvailabilityCalendarLoadingWeek
          key={formatDateKey(weekStartDate)}
          rangeStartDate={rangeStartDate}
          showFullWeekColumns={showFullWeekColumns}
          weekStartDate={weekStartDate}
        />
      ))}
    </div>
  )
}

type AvailabilityCalendarLoadingWeekProps = {
  rangeStartDate: Date
  showFullWeekColumns: boolean
  weekStartDate: Date
}

function AvailabilityCalendarLoadingWeek({
  rangeStartDate,
  showFullWeekColumns,
  weekStartDate,
}: AvailabilityCalendarLoadingWeekProps) {
  const weekKey = formatDateKey(weekStartDate)
  const visibleDayIndices = listVisibleWeekdayIndices(
    weekStartDate,
    rangeStartDate,
    showFullWeekColumns,
    AVAILABILITY_INITIAL_RANGE_DAY_COUNT,
  )
  const loadingTimeKeys = ['time-1', 'time-2', 'time-3', 'time-4', 'time-5']
  const dayHeaders = visibleDayIndices.map((dayIndex) => (
    <th
      key={`${weekKey}-${dayIndex}-header`}
      scope="col"
      className={cn(
        subtleSurfaceBackgroundClassName,
        subtleDividerClassName,
        availabilityCalendarColumnClassNames.day,
        'border-b px-3 py-3 text-center align-bottom',
      )}
    >
      <div className="space-y-1">
        <Skeleton className="mx-auto h-3 w-8 bg-card/70" />
        <Skeleton className="mx-auto h-5 w-14 bg-card/70" />
        <Skeleton className="mx-auto h-3 w-10 bg-card/55" />
      </div>
    </th>
  ))
  const body = loadingTimeKeys.map((timeKey) => (
    <tr key={`${weekKey}-${timeKey}`} className="group">
      <th
        scope="row"
        className={cn(
          subtleSurfaceBackgroundClassName,
          subtleDividerClassName,
          availabilityCalendarColumnClassNames.time,
          'sticky left-0 z-10 border-r px-3 py-2 text-center',
        )}
      >
        <Skeleton className="h-5 w-full rounded-none bg-card/55" />
      </th>
      {visibleDayIndices.map((dayIndex) => (
        <td
          key={`${weekKey}-${timeKey}-${dayIndex}`}
          className={cn(
            subtleDividerClassName,
            'border-l px-2 py-2 text-center',
          )}
        >
          <div className="flex h-8 items-center justify-center">
            <Skeleton className="h-8 w-12 rounded-full" />
          </div>
        </td>
      ))}
    </tr>
  ))

  return (
    <AvailabilityCalendarTableFrame
      body={body}
      dayHeaders={dayHeaders}
      label={formatAvailabilityWeekLabel(weekStartDate)}
    />
  )
}

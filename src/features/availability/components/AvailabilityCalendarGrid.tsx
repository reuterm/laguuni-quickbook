import { SectionHeader } from '@/components/ui/section-header'
import { addCalendarDays, parseLocalDate, startOfDay } from '@/lib/date'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

import {
  AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  groupAvailabilityWeeks,
  listVisibleWeekdayIndices,
} from '../availability-calendar'
import type { AvailabilityDayGroup } from '../availability-service'
import { AVAILABILITY_WEEK_DAY_COUNT } from '../availability-service'
import { AvailabilityCalendarWeek } from './AvailabilityCalendarWeek'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

type AvailabilityCalendarGridProps = {
  availabilityReferenceDate?: Date | undefined
  dayGroups: readonly AvailabilityDayGroup[]
} & AvailabilityBookingActionProps

export function AvailabilityCalendarGrid({
  availabilityReferenceDate,
  bookingActionMode,
  dayGroups,
  onBookSelection,
}: AvailabilityCalendarGridProps) {
  const weeks = groupAvailabilityWeeks(dayGroups).filter((week) =>
    week.days.some(
      (dayGroup) => dayGroup !== null && dayGroup.slots.length > 0,
    ),
  )
  const rangeStartDate = availabilityReferenceDate ?? new Date()
  const rangeEndDate = getRangeEndDate(dayGroups, rangeStartDate)
  const showFullWeekColumns = useMediaQuery(
    AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  )

  if (weeks.length === 0) {
    return null
  }

  return (
    <section className="space-y-4" aria-label="Availability calendar">
      <SectionHeader
        className="items-center px-1"
        contentClassName="space-y-0"
        title="Calendar"
        titleAs="h3"
        titleClassName="text-lg"
      />

      <div className="space-y-4">
        {weeks.map((week) => (
          <AvailabilityCalendarWeek
            key={week.id}
            visibleDayIndices={listVisibleWeekdayIndices(
              week.weekStartDate,
              rangeStartDate,
              showFullWeekColumns,
              getRangeDayCount(rangeStartDate, rangeEndDate),
            )}
            week={week}
            {...(bookingActionMode === 'hidden'
              ? { bookingActionMode }
              : { bookingActionMode, onBookSelection })}
          />
        ))}
      </div>
    </section>
  )
}

function getRangeDayCount(rangeStartDate: Date, rangeEndDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return (
    Math.floor(
      (startOfDay(rangeEndDate).getTime() -
        startOfDay(rangeStartDate).getTime()) /
        millisecondsPerDay,
    ) + 1
  )
}

function getRangeEndDate(
  dayGroups: readonly AvailabilityDayGroup[],
  fallbackStartDate: Date,
) {
  const lastDayGroup = dayGroups.at(-1)

  if (lastDayGroup === undefined) {
    return addCalendarDays(fallbackStartDate, AVAILABILITY_WEEK_DAY_COUNT)
  }

  return parseLocalDate(lastDayGroup.date)
}

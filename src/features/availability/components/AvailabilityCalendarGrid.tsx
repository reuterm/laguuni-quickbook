import { SectionHeader } from '@/components/ui/section-header'
import { eyebrowClassName } from '@/components/ui/styles'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

import {
  AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  groupAvailabilityWeeks,
  listVisibleWeekdayIndices,
} from '../availability-calendar'
import type { AvailabilityDayGroup } from '../availability-service'
import { AVAILABILITY_RANGE_DAY_COUNT } from '../availability-service'
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
  const weeks = groupAvailabilityWeeks(dayGroups)
  const rangeStartDate = availabilityReferenceDate ?? new Date()
  const showFullWeekColumns = useMediaQuery(
    AVAILABILITY_CALENDAR_BREAKPOINT_QUERY,
  )

  return (
    <section className="space-y-4" aria-label="Availability calendar">
      <SectionHeader
        className="items-center px-1"
        contentClassName="space-y-0"
        title="Calendar"
        titleAs="h3"
        titleClassName="text-lg"
        actions={
          <p className={eyebrowClassName}>
            {dayGroups.length} {dayGroups.length === 1 ? 'day' : 'days'} in
            range
          </p>
        }
      />

      <div className="space-y-4">
        {weeks.map((week) => (
          <AvailabilityCalendarWeek
            key={week.id}
            visibleDayIndices={listVisibleWeekdayIndices(
              week.weekStartDate,
              rangeStartDate,
              showFullWeekColumns,
              AVAILABILITY_RANGE_DAY_COUNT,
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

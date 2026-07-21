import {
  eyebrowClassName,
  subtleDividerClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { formatLocalDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { BookingSlotSelection } from '../../../domain/booking'
import {
  type AvailabilityWeek,
  createSlotLookup,
  createSlotLookupKey,
  formatAvailabilityDayLabel,
  getWeekdayDate,
  getWeekdayLabel,
  listCalendarTimes,
} from '../availability-calendar'
import { AvailabilityCalendarTableFrame } from './AvailabilityCalendarTableFrame'
import { AvailabilityCapacityChip } from './availability-badge'
import type { AvailabilityBookingActionProps } from './availability-booking-action'
import { availabilityCalendarColumnClassNames } from './availability-calendar-ui'

type AvailabilityCalendarWeekProps = {
  visibleDayIndices: readonly number[]
  week: AvailabilityWeek
  isSelected?: (selection: BookingSlotSelection) => boolean
  onAddSelection?: (selection: BookingSlotSelection) => void
  onRemoveSelection?: (selection: BookingSlotSelection) => void
} & AvailabilityBookingActionProps

export function AvailabilityCalendarWeek({
  bookingActionMode,
  isSelected = () => false,
  onAddSelection,
  onBookSelection,
  onRemoveSelection,
  visibleDayIndices,
  week,
}: AvailabilityCalendarWeekProps) {
  const timeRows = listCalendarTimes(week.days)
  const slotLookup = createSlotLookup(week.days)
  const isBasketEditing =
    onAddSelection !== undefined && onRemoveSelection !== undefined
  const dayHeaders = visibleDayIndices.map((dayIndex) => {
    const weekdayLabel = getWeekdayLabel(dayIndex)
    const dayGroup = week.days[dayIndex] ?? null
    const dayDate = getWeekdayDate(week.weekStartDate, dayIndex)

    return (
      <th
        key={`${week.id}-${weekdayLabel}`}
        scope="col"
        className={cn(
          subtleSurfaceBackgroundClassName,
          subtleDividerClassName,
          availabilityCalendarColumnClassNames.day,
          'border-b px-3 py-3 text-center align-bottom',
        )}
      >
        <div className="space-y-1">
          <p className={eyebrowClassName}>{weekdayLabel}</p>
          <p className="text-sm font-semibold text-foreground">
            {formatAvailabilityDayLabel(
              dayGroup?.date ?? formatLocalDate(dayDate),
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {dayGroup?.slots.length ?? 0} slot
            {dayGroup?.slots.length === 1 ? '' : 's'}
          </p>
        </div>
      </th>
    )
  })
  const body =
    timeRows.length > 0 ? (
      timeRows.map((time) => (
        <tr key={`${week.id}-${time}`} className="group">
          <th
            scope="row"
            className={cn(
              subtleSurfaceBackgroundClassName,
              subtleDividerClassName,
              availabilityCalendarColumnClassNames.time,
              'sticky left-0 z-10 border-r px-3 py-2 text-center group-hover:bg-muted/45',
            )}
          >
            <span className="text-sm font-medium tabular-nums text-foreground">
              {time}
            </span>
          </th>

          {visibleDayIndices.map((dayIndex) => {
            const weekdayLabel = getWeekdayLabel(dayIndex)
            const dayGroup = week.days[dayIndex] ?? null
            const slot = dayGroup
              ? slotLookup.get(createSlotLookupKey(dayGroup.date, time))
              : null
            const slotSelectionProps =
              isBasketEditing && slot
                ? isSelected(slot.selection)
                  ? {
                      actionLabel: `Remove ${slot.startTime}-${slot.endTime}, ${slot.freeCapacity} spots free`,
                      onClick: () => onRemoveSelection(slot.selection),
                      pressed: true,
                    }
                  : {
                      actionLabel: `Add ${slot.startTime}-${slot.endTime}, ${slot.freeCapacity} spots free`,
                      onClick: () => onAddSelection(slot.selection),
                      pressed: false,
                    }
                : bookingActionMode !== 'hidden' && slot
                  ? {
                      disabled: bookingActionMode === 'disabled',
                      onClick: () => onBookSelection(slot.selection),
                    }
                  : {}

            return (
              <td
                key={`${week.id}-${weekdayLabel}-${time}`}
                className={cn(
                  subtleDividerClassName,
                  'border-l px-2 py-2 text-center group-hover:bg-white/[0.02]',
                )}
              >
                {slot ? (
                  <AvailabilityCapacityChip
                    slot={slot}
                    className="min-w-11 px-2.5 py-1"
                    {...slotSelectionProps}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-8 w-12 items-center justify-center text-sm text-muted-foreground/50"
                  >
                    -
                  </span>
                )}
              </td>
            )
          })}
        </tr>
      ))
    ) : (
      <tr>
        <td
          colSpan={visibleDayIndices.length + 1}
          className="px-3 py-6 text-center text-sm text-muted-foreground"
        >
          No availability loaded for this week.
        </td>
      </tr>
    )

  return (
    <AvailabilityCalendarTableFrame
      body={body}
      dayHeaders={dayHeaders}
      label={week.label}
    />
  )
}

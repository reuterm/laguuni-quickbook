import { useEffect, useState } from 'react'

import { SectionHeader } from '@/components/ui/section-header'
import {
  eyebrowClassName,
  panelSurfaceClassName,
  subtleDividerClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'

import type { AvailabilitySlot } from '../availability-model'
import type { AvailabilityDayGroup } from '../availability-service'
import {
  AvailabilityBadge,
  AvailabilityBadgeButton,
} from './availability-badge'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

const WEEKDAY_LABELS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const

const calendarMatrixColumnClassNames = {
  day: 'w-[5.75rem] min-w-[5.75rem]',
  time: 'w-[5rem] min-w-[5rem]',
} as const

type AvailabilityCalendarGridProps = {
  availabilityReferenceDate?: Date | undefined
  dayGroups: readonly AvailabilityDayGroup[]
  showFullWeekColumns?: boolean | undefined
} & AvailabilityBookingActionProps

type AvailabilityWeek = {
  days: Array<AvailabilityDayGroup | null>
  id: string
  label: string
  weekStartDate: Date
}

export function AvailabilityCalendarGrid({
  availabilityReferenceDate,
  bookingActionMode,
  dayGroups,
  onBookSelection,
  showFullWeekColumns: showFullWeekColumnsOverride,
}: AvailabilityCalendarGridProps) {
  const weeks = groupAvailabilityWeeks(dayGroups)
  const rangeStartDate = availabilityReferenceDate ?? new Date()
  const mediaQueryMatches = useMediaQuery('(min-width: 768px)')
  const showFullWeekColumns = showFullWeekColumnsOverride ?? mediaQueryMatches

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
        {weeks.map((week) => {
          const visibleDayIndices = listVisibleWeekdayIndices(
            week.weekStartDate,
            rangeStartDate,
            showFullWeekColumns,
          )
          const timeRows = listCalendarTimes(week.days)
          const slotLookup = createSlotLookup(week.days)

          return (
            <section
              key={week.id}
              className={cn(panelSurfaceClassName, 'overflow-hidden')}
            >
              <div className="border-b border-border/70 px-4 py-3 sm:px-5">
                <p className={eyebrowClassName}>{week.label}</p>
              </div>

              <div className="overflow-x-auto overscroll-x-contain">
                <div className="pb-3 pr-3 pt-3 sm:pb-4 sm:pr-4 sm:pt-4">
                  <table className="w-full border-separate border-spacing-0 md:table-fixed">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className={cn(
                            subtleSurfaceBackgroundClassName,
                            subtleDividerClassName,
                            calendarMatrixColumnClassNames.time,
                            'sticky left-0 z-20 border-b border-r px-3 py-3 text-center align-bottom',
                          )}
                        >
                          <span className={eyebrowClassName}>Time</span>
                        </th>

                        {visibleDayIndices.map((dayIndex) => {
                          const weekdayLabel = WEEKDAY_LABELS[dayIndex]
                          const dayGroup = week.days[dayIndex] ?? null
                          const dayDate = getWeekdayDate(
                            week.weekStartDate,
                            dayIndex,
                          )

                          return (
                            <th
                              key={`${week.id}-${weekdayLabel}`}
                              scope="col"
                              className={cn(
                                subtleSurfaceBackgroundClassName,
                                subtleDividerClassName,
                                calendarMatrixColumnClassNames.day,
                                'border-b px-3 py-3 text-center align-bottom',
                              )}
                            >
                              <div className="space-y-1">
                                <p className={eyebrowClassName}>
                                  {weekdayLabel}
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  {getDayNumberLabel(formatDateKey(dayDate))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {dayGroup?.slots.length ?? 0} slot
                                  {dayGroup?.slots.length === 1 ? '' : 's'}
                                </p>
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {timeRows.length > 0 ? (
                        timeRows.map((time) => (
                          <tr key={`${week.id}-${time}`} className="group">
                            <th
                              scope="row"
                              className={cn(
                                subtleSurfaceBackgroundClassName,
                                subtleDividerClassName,
                                calendarMatrixColumnClassNames.time,
                                'sticky left-0 z-10 border-r px-3 py-2 text-center group-hover:bg-muted/45',
                              )}
                            >
                              <span className="text-sm font-medium tabular-nums text-foreground">
                                {time}
                              </span>
                            </th>

                            {visibleDayIndices.map((dayIndex) => {
                              const weekdayLabel = WEEKDAY_LABELS[dayIndex]
                              const dayGroup = week.days[dayIndex] ?? null
                              const slot = dayGroup
                                ? slotLookup.get(
                                    createSlotLookupKey(dayGroup.date, time),
                                  )
                                : null

                              return (
                                <td
                                  key={`${week.id}-${weekdayLabel}-${time}`}
                                  className={cn(
                                    subtleDividerClassName,
                                    'border-l px-2 py-2 text-center group-hover:bg-white/[0.02]',
                                  )}
                                >
                                  {slot ? (
                                    renderAvailabilityCalendarCellAction(
                                      bookingActionMode,
                                      slot,
                                      onBookSelection,
                                    )
                                  ) : (
                                    <span
                                      aria-hidden="true"
                                      className="inline-block h-8 w-12 rounded-full border border-dashed border-border/50 bg-muted/20"
                                    />
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
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

function renderAvailabilityCalendarCellAction(
  bookingActionMode: AvailabilityBookingActionProps['bookingActionMode'],
  slot: AvailabilitySlot,
  onBookSelection?: (selection: AvailabilitySlot['selection']) => void,
) {
  if (bookingActionMode === 'hidden') {
    return <AvailabilityBadge className="min-w-11 px-2.5 py-1" slot={slot} />
  }

  if (bookingActionMode === 'disabled') {
    return <AvailabilityBadgeButton disabled slot={slot} />
  }

  return (
    <AvailabilityBadgeButton
      onClick={() => onBookSelection?.(slot.selection)}
      slot={slot}
    />
  )
}

function listCalendarTimes(
  dayGroups: readonly (AvailabilityDayGroup | null)[],
) {
  const times = new Set<string>()

  for (const dayGroup of dayGroups) {
    if (!dayGroup) {
      continue
    }

    for (const slot of dayGroup.slots) {
      times.add(slot.startTime)
    }
  }

  return [...times].sort((left, right) => left.localeCompare(right))
}

function createSlotLookup(dayGroups: readonly (AvailabilityDayGroup | null)[]) {
  const slotLookup = new Map<string, AvailabilitySlot>()

  for (const dayGroup of dayGroups) {
    if (!dayGroup) {
      continue
    }

    for (const slot of dayGroup.slots) {
      slotLookup.set(createSlotLookupKey(dayGroup.date, slot.startTime), slot)
    }
  }

  return slotLookup
}

function createSlotLookupKey(date: string, startTime: string) {
  return `${date}:${startTime}`
}

function groupAvailabilityWeeks(dayGroups: readonly AvailabilityDayGroup[]) {
  const dayGroupsByWeek = new Map<string, AvailabilityWeek>()

  for (const dayGroup of dayGroups) {
    const weekStartDate = getWeekStartDate(dayGroup.date)
    const weekId = formatDateKey(weekStartDate)
    const weekdayIndex = getWeekdayIndex(dayGroup.date)
    const existingWeek = dayGroupsByWeek.get(weekId)

    if (existingWeek) {
      existingWeek.days[weekdayIndex] = dayGroup
      continue
    }

    const days = Array<AvailabilityDayGroup | null>(7).fill(null)
    days[weekdayIndex] = dayGroup

    dayGroupsByWeek.set(weekId, {
      days,
      id: weekId,
      label: getWeekLabel(weekStartDate),
      weekStartDate,
    })
  }

  return [...dayGroupsByWeek.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  )
}

function getWeekStartDate(date: string) {
  const currentDate = new Date(`${date}T00:00:00`)
  const weekday = currentDate.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  currentDate.setDate(currentDate.getDate() + mondayOffset)

  return currentDate
}

function getWeekdayIndex(date: string) {
  const weekday = new Date(`${date}T00:00:00`).getDay()

  return weekday === 0 ? 6 : weekday - 1
}

function getWeekLabel(weekStartDate: Date) {
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)

  const monthFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return `${monthFormatter.format(weekStartDate)} - ${monthFormatter.format(weekEndDate)}`
}

function getDayNumberLabel(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

function getWeekdayDate(weekStartDate: Date, dayIndex: number) {
  const dayDate = new Date(weekStartDate)
  dayDate.setDate(dayDate.getDate() + dayIndex)

  return dayDate
}

function listVisibleWeekdayIndices(
  weekStartDate: Date,
  rangeStartDate: Date,
  showFullWeekColumns: boolean,
  rangeDayCount: number = 7,
) {
  if (showFullWeekColumns) {
    return WEEKDAY_LABELS.map((_, dayIndex) => dayIndex)
  }

  const rangeStart = startOfDay(rangeStartDate)
  const rangeEnd = startOfDay(rangeStartDate)
  rangeEnd.setDate(rangeEnd.getDate() + rangeDayCount - 1)

  const visibleDayIndices: number[] = []

  for (const [dayIndex] of WEEKDAY_LABELS.entries()) {
    const dayDate = new Date(weekStartDate)
    dayDate.setDate(dayDate.getDate() + dayIndex)

    if (dayDate >= rangeStart && dayDate <= rangeEnd) {
      visibleDayIndices.push(dayIndex)
    }
  }

  return visibleDayIndices
}

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)

  return day
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return false
    }

    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined
    }

    const mediaQuery = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export { groupAvailabilityWeeks, listVisibleWeekdayIndices }

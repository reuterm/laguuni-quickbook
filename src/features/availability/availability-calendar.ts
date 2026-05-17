import {
  addCalendarDays,
  addWeeks,
  formatLocalDate,
  type LocalDateString,
  parseLocalDate,
  startOfDay,
  startOfWeek,
} from '@/lib/date'
import type {
  AvailabilityDayGroup,
  AvailabilitySlot,
} from './availability-model'

export const AVAILABILITY_CALENDAR_BREAKPOINT_QUERY = '(min-width: 758px)'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export type AvailabilityWeek = {
  days: Array<AvailabilityDayGroup | null>
  id: string
  label: string
  weekStartDate: Date
}

export function groupAvailabilityWeeks(
  dayGroups: readonly AvailabilityDayGroup[],
) {
  const dayGroupsByWeek = new Map<string, AvailabilityWeek>()

  for (const dayGroup of dayGroups) {
    const weekStartDate = startOfWeek(parseLocalDate(dayGroup.date))
    const weekId = formatLocalDate(weekStartDate)
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
      label: formatAvailabilityWeekLabel(weekStartDate),
      weekStartDate,
    })
  }

  return [...dayGroupsByWeek.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  )
}

export function listVisibleWeekdayIndices(
  weekStartDate: Date,
  rangeStartDate: Date,
  showFullWeekColumns: boolean,
  rangeDayCount: number,
  dayGroups: readonly (AvailabilityDayGroup | null)[],
) {
  if (showFullWeekColumns) {
    return weekdayLabels.map((_, dayIndex) => dayIndex)
  }

  const rangeStart = startOfDay(rangeStartDate)
  const rangeEnd = addCalendarDays(rangeStartDate, rangeDayCount - 1)

  const visibleDayIndices: number[] = []

  for (const [dayIndex] of weekdayLabels.entries()) {
    const dayDate = getWeekdayDate(weekStartDate, dayIndex)

    if (dayDate >= rangeStart && dayDate <= rangeEnd) {
      visibleDayIndices.push(dayIndex)
    }
  }

  const firstBookableVisibleIndex = visibleDayIndices.findIndex((dayIndex) => {
    const dayGroup = dayGroups[dayIndex]

    return dayGroup != null && dayGroup.slots.length > 0
  })

  return firstBookableVisibleIndex > 0
    ? visibleDayIndices.slice(firstBookableVisibleIndex)
    : visibleDayIndices
}

export function listCalendarSkeletonWeeks(
  rangeStartDate: Date,
  rangeDayCount: number,
) {
  const rangeEndDate = addCalendarDays(rangeStartDate, rangeDayCount - 1)

  const weeks: Date[] = []
  let currentWeekStartDate = startOfWeek(rangeStartDate)

  while (currentWeekStartDate <= rangeEndDate) {
    weeks.push(currentWeekStartDate)
    currentWeekStartDate = addWeeks(new Date(currentWeekStartDate), 1)
  }

  return weeks
}

export function listCalendarTimes(
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

export function createSlotLookup(
  dayGroups: readonly (AvailabilityDayGroup | null)[],
) {
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

export function createSlotLookupKey(date: LocalDateString, startTime: string) {
  return `${date}:${startTime}`
}

export function formatAvailabilityDayLabel(date: LocalDateString) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(parseLocalDate(date))
}

export function formatAvailabilityWeekLabel(weekStartDate: Date) {
  const weekEndDate = addCalendarDays(weekStartDate, 6)

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return `${formatter.format(weekStartDate)} - ${formatter.format(weekEndDate)}`
}

export function getWeekdayDate(weekStartDate: Date, dayIndex: number) {
  return addCalendarDays(weekStartDate, dayIndex)
}

export function getWeekdayLabel(dayIndex: number) {
  return weekdayLabels[dayIndex]
}

function getWeekdayIndex(date: LocalDateString) {
  const weekday = parseLocalDate(date).getDay()

  return weekday === 0 ? 6 : weekday - 1
}

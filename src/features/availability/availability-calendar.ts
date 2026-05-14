import { parseLocalDate } from '../../lib/date'
import type {
  AvailabilityDayGroup,
  AvailabilitySlot,
} from './availability-model'

export const AVAILABILITY_CALENDAR_BREAKPOINT_QUERY = '(min-width: 768px)'

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
) {
  if (showFullWeekColumns) {
    return weekdayLabels.map((_, dayIndex) => dayIndex)
  }

  const rangeStart = startOfDay(rangeStartDate)
  const rangeEnd = startOfDay(rangeStartDate)
  rangeEnd.setDate(rangeEnd.getDate() + rangeDayCount - 1)

  const visibleDayIndices: number[] = []

  for (const [dayIndex] of weekdayLabels.entries()) {
    const dayDate = getWeekdayDate(weekStartDate, dayIndex)

    if (dayDate >= rangeStart && dayDate <= rangeEnd) {
      visibleDayIndices.push(dayIndex)
    }
  }

  return visibleDayIndices
}

export function listCalendarSkeletonWeeks(
  rangeStartDate: Date,
  rangeDayCount: number,
) {
  const rangeEndDate = startOfDay(rangeStartDate)
  rangeEndDate.setDate(rangeEndDate.getDate() + rangeDayCount - 1)

  const weeks: Date[] = []
  let currentWeekStartDate = getWeekStartDate(formatDateKey(rangeStartDate))

  while (currentWeekStartDate <= rangeEndDate) {
    weeks.push(currentWeekStartDate)
    const nextWeekStartDate = new Date(currentWeekStartDate)
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7)
    currentWeekStartDate = nextWeekStartDate
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

export function createSlotLookupKey(date: string, startTime: string) {
  return `${date}:${startTime}`
}

export function formatAvailabilityDayLabel(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(parseLocalDate(date))
}

export function formatAvailabilityWeekLabel(weekStartDate: Date) {
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return `${formatter.format(weekStartDate)} - ${formatter.format(weekEndDate)}`
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getWeekdayDate(weekStartDate: Date, dayIndex: number) {
  const dayDate = new Date(weekStartDate)
  dayDate.setDate(dayDate.getDate() + dayIndex)

  return dayDate
}

export function getWeekdayLabel(dayIndex: number) {
  return weekdayLabels[dayIndex]
}

function getWeekStartDate(date: string) {
  const currentDate = parseLocalDate(date)
  const weekday = currentDate.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  currentDate.setDate(currentDate.getDate() + mondayOffset)

  return startOfDay(currentDate)
}

function getWeekdayIndex(date: string) {
  const weekday = parseLocalDate(date).getDay()

  return weekday === 0 ? 6 : weekday - 1
}

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)

  return day
}

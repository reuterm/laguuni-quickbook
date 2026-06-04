import type { CableId } from '@/domain/cable'
import type { DailyAvailabilityWindow } from '@/domain/slot'
import type { LaguuniApi } from '@/lib/api/laguuni-api'
import {
  addCalendarDays,
  formatDisplayDate,
  formatLocalDate,
  type LocalDateString,
  parseLocalDate,
  startOfWeek,
} from '@/lib/date'
import type { AvailabilityDayGroup } from './availability-model'
import { createAvailabilitySlots } from './availability-slots'

export const AVAILABILITY_WEEK_DAY_COUNT = 7
export const AVAILABILITY_INITIAL_WEEK_COUNT = 2
export const AVAILABILITY_MAX_WEEK_COUNT = 4
export const AVAILABILITY_INITIAL_RANGE_DAY_COUNT =
  AVAILABILITY_WEEK_DAY_COUNT * AVAILABILITY_INITIAL_WEEK_COUNT

export type AvailabilityWeekPage = {
  dayGroups: readonly AvailabilityDayGroup[]
  hasBookableSlots: boolean
  weekId: string
  weekStartDate: Date
}

export type {
  AvailabilityDayGroup,
  AvailabilitySlot,
} from './availability-model'
export { createAvailabilitySlots } from './availability-slots'

export async function loadAvailabilityDay(
  api: LaguuniApi,
  cableId: CableId,
  date: LocalDateString,
): Promise<AvailabilityDayGroup> {
  const availableDates = await loadAvailableDateSet(api, cableId, [date])

  if (!availableDates.has(date)) {
    return createEmptyAvailabilityDayGroup(date)
  }

  const dailyWindow = await api.getDailyAvailabilityWindow(cableId, date)

  return createAvailabilityDayGroup(dailyWindow)
}

export async function loadAvailabilityWeek(
  api: LaguuniApi,
  cableId: CableId,
  weekStartDate: Date = new Date(),
): Promise<AvailabilityWeekPage> {
  const normalizedWeekStartDate = startOfWeek(weekStartDate)
  const dayGroups = await loadAvailabilityOverview(
    api,
    cableId,
    normalizedWeekStartDate,
    1,
  )

  return createAvailabilityWeekPage(normalizedWeekStartDate, dayGroups)
}

export async function loadAvailabilityOverview(
  api: LaguuniApi,
  cableId: CableId,
  rangeStartDate: Date = new Date(),
  weekCount: number = AVAILABILITY_INITIAL_WEEK_COUNT,
): Promise<readonly AvailabilityDayGroup[]> {
  const normalizedStartDate = startOfWeek(rangeStartDate)
  return loadAvailabilityRangeDayGroups(
    api,
    cableId,
    normalizedStartDate,
    weekCount * AVAILABILITY_WEEK_DAY_COUNT,
  )
}

async function loadAvailabilityRangeDayGroups(
  api: LaguuniApi,
  cableId: CableId,
  rangeStartDate: Date,
  dayCount: number,
): Promise<readonly AvailabilityDayGroup[]> {
  const datesInRange = listDatesInRange(rangeStartDate, dayCount)
  const availableDates = await loadAvailableDateSet(api, cableId, datesInRange)

  return Promise.all(
    datesInRange.map(async (date) => {
      if (!availableDates.has(date)) {
        return createEmptyAvailabilityDayGroup(date)
      }

      return createAvailabilityDayGroup(
        await api.getDailyAvailabilityWindow(cableId, date),
      )
    }),
  )
}

async function loadAvailableDateSet(
  api: LaguuniApi,
  cableId: CableId,
  dates: readonly LocalDateString[],
): Promise<ReadonlySet<LocalDateString>> {
  const monthAnchorDates = [...new Set(dates.map(getMonthAnchorDate))]
  const availableDates = await Promise.all(
    monthAnchorDates.map((anchorDate) =>
      api.getAvailableDates(cableId, anchorDate),
    ),
  )

  return new Set(
    availableDates.flatMap((monthDates) => monthDates.map((date) => date.date)),
  )
}

function createAvailabilityWeekPage(
  weekStartDate: Date,
  dayGroups: readonly AvailabilityDayGroup[],
): AvailabilityWeekPage {
  return {
    dayGroups,
    hasBookableSlots: dayGroups.some((dayGroup) => dayGroup.slots.length > 0),
    weekId: formatLocalDate(weekStartDate),
    weekStartDate,
  }
}

function createAvailabilityDayGroup(
  dailyWindow: DailyAvailabilityWindow,
): AvailabilityDayGroup {
  return {
    date: dailyWindow.date,
    displayDate: formatDisplayDate(dailyWindow.date),
    slots: createAvailabilitySlots(dailyWindow),
  }
}

function createEmptyAvailabilityDayGroup(
  date: LocalDateString,
): AvailabilityDayGroup {
  return {
    date,
    displayDate: formatDisplayDate(date),
    slots: [],
  }
}

function getMonthAnchorDate(date: LocalDateString): LocalDateString {
  const monthAnchorDate = parseLocalDate(date)
  monthAnchorDate.setDate(1)

  return formatLocalDate(monthAnchorDate)
}

function listDatesInRange(
  rangeStartDate: Date,
  dayCount: number,
): readonly LocalDateString[] {
  return Array.from({ length: dayCount }, (_, index) =>
    formatLocalDate(addCalendarDays(rangeStartDate, index)),
  )
}

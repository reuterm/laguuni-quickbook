import type { CableId } from '../../domain/cable'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import {
  addCalendarDays,
  formatLocalDate,
  type LocalDateString,
  startOfWeek,
} from '../../lib/date'
import { formatDisplayDate } from './availability-format'
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
  const dailyWindow = await api.getDailyAvailabilityWindow(cableId, date)

  return {
    date: dailyWindow.date,
    displayDate: formatDisplayDate(dailyWindow.date),
    slots: createAvailabilitySlots(dailyWindow),
  }
}

export async function loadAvailabilityWeek(
  api: LaguuniApi,
  cableId: CableId,
  weekStartDate: Date = new Date(),
): Promise<AvailabilityWeekPage> {
  const normalizedWeekStartDate = startOfWeek(weekStartDate)
  const dayGroups = await loadAvailabilityRange(
    api,
    cableId,
    normalizedWeekStartDate,
    AVAILABILITY_WEEK_DAY_COUNT,
  )

  return {
    dayGroups,
    hasBookableSlots: dayGroups.some((dayGroup) => dayGroup.slots.length > 0),
    weekId: formatLocalDate(normalizedWeekStartDate),
    weekStartDate: normalizedWeekStartDate,
  }
}

export async function loadAvailabilityOverview(
  api: LaguuniApi,
  cableId: CableId,
  rangeStartDate: Date = new Date(),
  weekCount: number = AVAILABILITY_INITIAL_WEEK_COUNT,
): Promise<readonly AvailabilityDayGroup[]> {
  const normalizedStartDate = startOfWeek(rangeStartDate)
  const weekPages = await Promise.all(
    Array.from({ length: weekCount }, (_, index) =>
      loadAvailabilityWeek(
        api,
        cableId,
        addCalendarDays(
          normalizedStartDate,
          index * AVAILABILITY_WEEK_DAY_COUNT,
        ),
      ),
    ),
  )

  return weekPages.flatMap((weekPage) => weekPage.dayGroups)
}

async function loadAvailabilityRange(
  api: LaguuniApi,
  cableId: CableId,
  rangeStartDate: Date,
  dayCount: number,
) {
  const datesInRange = listDatesInRange(rangeStartDate, dayCount)
  const dailyWindows = await Promise.all(
    datesInRange.map((date) => api.getDailyAvailabilityWindow(cableId, date)),
  )

  return dailyWindows.map((dailyWindow) => {
    const dayGroup = {
      date: dailyWindow.date,
      displayDate: formatDisplayDate(dailyWindow.date),
      slots: createAvailabilitySlots(dailyWindow),
    } satisfies AvailabilityDayGroup

    return dayGroup
  })
}

function listDatesInRange(
  rangeStartDate: Date,
  dayCount: number,
): readonly LocalDateString[] {
  return Array.from({ length: dayCount }, (_, index) =>
    formatLocalDate(addCalendarDays(rangeStartDate, index)),
  )
}

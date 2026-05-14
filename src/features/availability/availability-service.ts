import type { CableId } from '../../domain/cable'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import { createAnchorDate, formatDisplayDate } from './availability-format'
import type { AvailabilityDayGroup } from './availability-model'
import { createAvailabilitySlots } from './availability-slots'

export const AVAILABILITY_RANGE_DAY_COUNT = 7

export type {
  AvailabilityDayGroup,
  AvailabilitySlot,
} from './availability-model'
export { createAvailabilitySlots } from './availability-slots'

export async function loadAvailabilityOverview(
  api: LaguuniApi,
  cableId: CableId,
  referenceDate: Date = new Date(),
): Promise<readonly AvailabilityDayGroup[]> {
  const datesInRange = listDatesInRange(
    referenceDate,
    AVAILABILITY_RANGE_DAY_COUNT,
  )
  const dailyWindows = await Promise.all(
    datesInRange.map((date) => api.getDailyAvailabilityWindow(cableId, date)),
  )

  return dailyWindows
    .map((dailyWindow) => {
      const dayGroup = {
        date: dailyWindow.date,
        displayDate: formatDisplayDate(dailyWindow.date),
        slots: createAvailabilitySlots(dailyWindow),
      } satisfies AvailabilityDayGroup

      return dayGroup
    })
    .filter((dayGroup) => dayGroup.slots.length > 0)
}

function listDatesInRange(
  rangeStartDate: Date,
  dayCount: number,
): readonly string[] {
  return Array.from({ length: dayCount }, (_, index) =>
    createAnchorDate(addDays(rangeStartDate, index)),
  )
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

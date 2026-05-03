import type { CableId } from '../../domain/cable'
import type { AvailableDate } from '../../domain/slot'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import { createAnchorDate, formatDisplayDate } from './availability-format'
import type { AvailabilityDayGroup } from './availability-model'
import { createAvailabilitySlots } from './availability-slots'

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
  const anchorDate = createAnchorDate(referenceDate)
  const availableDates = await api.getAvailableDates(cableId, anchorDate)

  return loadAvailabilityDayGroups(api, cableId, availableDates)
}

async function loadAvailabilityDayGroups(
  api: LaguuniApi,
  cableId: CableId,
  availableDates: readonly AvailableDate[],
): Promise<readonly AvailabilityDayGroup[]> {
  const bookableDates = availableDates.filter(
    (availableDate) => availableDate.hasBookableSlots,
  )

  if (bookableDates.length === 0) {
    return []
  }

  const dailyWindows = await Promise.all(
    bookableDates.map((availableDate) =>
      api.getDailyAvailabilityWindow(cableId, availableDate.date),
    ),
  )

  return bookableDates
    .map((availableDate, index) => {
      const dailyWindow = dailyWindows[index]

      if (!dailyWindow) {
        throw new Error(
          `Missing mocked daily availability for ${availableDate.date}`,
        )
      }

      return {
        date: availableDate.date,
        displayDate: formatDisplayDate(availableDate.date),
        slots: createAvailabilitySlots(dailyWindow),
      }
    })
    .filter((dayGroup) => dayGroup.slots.length > 0)
}

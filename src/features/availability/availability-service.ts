import type { CableId } from '../../domain/cable'
import { getCableById } from '../../domain/cable'
import type {
  AvailableDate,
  BookingSegment,
  CapacitySegment,
  DailyAvailabilityWindow,
} from '../../domain/slot'
import type { LaguuniApi } from '../../lib/api/laguuni-api'

export type AvailabilitySlot = {
  availabilityLabel: string
  endTime: string
  id: string
  selection: AvailabilitySlotSelection
  startTime: string
}

export type AvailabilitySlotSelection = {
  cableId: CableId
  date: string
  endTime: string
  productId: string
  startTime: string
}

export type AvailabilityDayGroup = {
  date: string
  displayDate: string
  slots: readonly AvailabilitySlot[]
}

const SLOT_DURATION_MINUTES = 60
const DEFAULT_TOTAL_CAPACITY = 4

export async function loadAvailabilityOverview(
  api: LaguuniApi,
  cableId: CableId,
  referenceDate: Date = new Date(),
): Promise<readonly AvailabilityDayGroup[]> {
  const anchorDate = createAnchorDate(referenceDate)
  const availableDates = await api.getAvailableDates(cableId, anchorDate)

  return loadAvailabilityDayGroups(api, cableId, availableDates)
}

export function createAvailabilitySlots(
  dailyWindow: DailyAvailabilityWindow,
): readonly AvailabilitySlot[] {
  const totalCapacity = inferTotalCapacity(dailyWindow.capacitySegments)
  const cableId = dailyWindow.cableId
  const { productId } = getCableById(cableId)
  const slotStartMinutes = listBookableHourStartMinutes(
    dailyWindow.bookingSegments,
  )

  return slotStartMinutes.flatMap((startMinute) => {
    const capacitySegment = findCoveringCapacitySegment(
      dailyWindow.capacitySegments,
      startMinute,
    )

    if (!capacitySegment) {
      return []
    }

    return {
      availabilityLabel: formatAvailabilityLabel(
        totalCapacity,
        capacitySegment.occupiedCapacity,
      ),
      endTime: formatMinuteOfDay(startMinute + SLOT_DURATION_MINUTES),
      id: `${dailyWindow.date}-${startMinute}`,
      selection: {
        cableId,
        date: dailyWindow.date,
        endTime: formatMinuteOfDay(startMinute + SLOT_DURATION_MINUTES),
        productId,
        startTime: formatMinuteOfDay(startMinute),
      },
      startTime: formatMinuteOfDay(startMinute),
    }
  })
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

function listBookableHourStartMinutes(
  bookingSegments: readonly BookingSegment[],
): readonly number[] {
  const slotStarts = new Set<number>()

  for (const segment of bookingSegments) {
    if (!segment.isBookable) {
      continue
    }

    for (
      let startMinute = roundUpToHour(segment.startMinute);
      startMinute + SLOT_DURATION_MINUTES <= segment.endMinute;
      startMinute += SLOT_DURATION_MINUTES
    ) {
      slotStarts.add(startMinute)
    }
  }

  return [...slotStarts].sort((left, right) => left - right)
}

function findCoveringCapacitySegment(
  capacitySegments: readonly CapacitySegment[],
  startMinute: number,
): CapacitySegment | undefined {
  return capacitySegments.find(
    (segment) =>
      segment.startMinute <= startMinute &&
      segment.endMinute >= startMinute + SLOT_DURATION_MINUTES,
  )
}

function inferTotalCapacity(
  capacitySegments: readonly CapacitySegment[],
): number {
  return capacitySegments.reduce(
    (highestCapacity, segment) =>
      Math.max(highestCapacity, segment.occupiedCapacity),
    DEFAULT_TOTAL_CAPACITY,
  )
}

function formatAvailabilityLabel(
  totalCapacity: number,
  occupiedCapacity: number,
): string {
  const freeCapacity = Math.max(totalCapacity - occupiedCapacity, 0)

  return `${freeCapacity}/${totalCapacity} free`
}

function roundUpToHour(minuteOfDay: number): number {
  return Math.ceil(minuteOfDay / SLOT_DURATION_MINUTES) * SLOT_DURATION_MINUTES
}

function formatMinuteOfDay(minuteOfDay: number): string {
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

function createAnchorDate(referenceDate: Date): string {
  const year = referenceDate.getFullYear()
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0')
  const day = String(referenceDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

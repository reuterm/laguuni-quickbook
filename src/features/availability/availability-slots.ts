import { formatMinuteOfDay } from '@/lib/date'
import type {
  BookingSegment,
  CapacitySegment,
  DailyAvailabilityWindow,
} from '../../domain/slot'
import type { AvailabilitySlot } from './availability-model'

const SLOT_DURATION_MINUTES = 60
const FALLBACK_TOTAL_CAPACITY = 4

export function createAvailabilitySlots(
  dailyWindow: DailyAvailabilityWindow,
): readonly AvailabilitySlot[] {
  const totalCapacity = inferTotalCapacity(dailyWindow.capacitySegments)
  const cableId = dailyWindow.cableId
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
      endTime: formatMinuteOfDay(startMinute + SLOT_DURATION_MINUTES),
      freeCapacity: Math.max(capacitySegment.freeCapacity, 0),
      id: `${dailyWindow.date}-${startMinute}`,
      selection: {
        cableId,
        date: dailyWindow.date,
        endTime: formatMinuteOfDay(startMinute + SLOT_DURATION_MINUTES),
        startTime: formatMinuteOfDay(startMinute),
      },
      startTime: formatMinuteOfDay(startMinute),
      totalCapacity,
    }
  })
}

function listBookableHourStartMinutes(
  bookingSegments: readonly BookingSegment[],
): readonly number[] {
  const slotStartMinutes = new Set<number>()

  for (const segment of bookingSegments) {
    if (
      !segment.isBookable ||
      segment.endMinute - segment.startMinute < SLOT_DURATION_MINUTES
    ) {
      continue
    }

    slotStartMinutes.add(segment.startMinute)
  }

  return Array.from(slotStartMinutes).toSorted((left, right) => left - right)
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
    (highestFreeCapacity, segment) =>
      Math.max(highestFreeCapacity, segment.freeCapacity),
    FALLBACK_TOTAL_CAPACITY,
  )
}

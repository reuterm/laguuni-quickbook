import type { CableId } from '../../domain/cable'
import type {
  AvailableDate,
  BookingSegment,
  CapacitySegment,
  DailyAvailabilityWindow,
} from '../../domain/slot'
import { type LocalDateString, setDate } from '../date'
import { isRecord, isStringArray } from '../type-guards'

export type RawAvailableDateTuple = readonly [
  dayOfMonth: number,
  hasBookableSlots: number,
]

export type RawAvailableDatesResponse = readonly RawAvailableDateTuple[]

export type RawAvailabilityTuple = readonly [
  startMinute: number,
  endMinute: number,
  value: number,
]

type RawEndTimesByStartTime = Readonly<Record<string, readonly string[]>>

export type RawAvailableTimesResponse = {
  endtimes: RawEndTimesByStartTime | readonly string[]
  starttimes: readonly string[]
  tomorrowtuples: readonly RawAvailabilityTuple[]
  tuples: readonly RawAvailabilityTuple[]
}

export function decodeAvailableDatesResponse(
  value: unknown,
): RawAvailableDatesResponse {
  if (!Array.isArray(value) || !value.every(isRawAvailableDateTuple)) {
    throw new Error(
      'Available date responses must contain [number, number] tuples',
    )
  }

  return value
}

export function decodeAvailableTimesResponse(
  value: unknown,
): RawAvailableTimesResponse {
  if (!isRecord(value)) {
    throw new Error('Availability time responses must be objects')
  }

  const { endtimes, starttimes, tomorrowtuples, tuples } = value

  if (
    !isValidRawEndTimes(endtimes) ||
    !isStringArray(starttimes) ||
    !isRawAvailabilityTupleList(tomorrowtuples) ||
    !isRawAvailabilityTupleList(tuples)
  ) {
    throw new Error(
      'Availability time responses must contain starttimes, endtimes, tuples, and tomorrowtuples',
    )
  }

  return {
    endtimes,
    starttimes,
    tomorrowtuples,
    tuples,
  }
}

export function normalizeAvailableDates(
  cableId: CableId,
  anchorDate: LocalDateString,
  rawResponse: RawAvailableDatesResponse,
): AvailableDate[] {
  const res: AvailableDate[] = []

  for (const [dayOfMonth, hasBookableSlots] of rawResponse) {
    if (hasBookableSlots < 0) {
      continue
    }

    res.push({
      cableId,
      date: setDate(anchorDate, dayOfMonth),
    })
  }
  return res
}

export function normalizeDailyAvailabilityWindow(
  cableId: CableId,
  date: LocalDateString,
  response: RawAvailableTimesResponse,
): DailyAvailabilityWindow {
  return {
    bookingSegments: normalizeBookingSegments(response),
    cableId,
    capacitySegments: normalizeCapacitySegments(response.tuples),
    date,
  }
}

function normalizeBookingSegments(
  response: RawAvailableTimesResponse,
): readonly BookingSegment[] {
  return normalizeHourLongStartTimes(response)
}

function normalizeHourLongStartTimes(
  response: RawAvailableTimesResponse,
): readonly BookingSegment[] {
  if (!isRawEndTimesByStartTime(response.endtimes)) {
    return []
  }

  const endTimesByStartTime = response.endtimes

  return response.starttimes.flatMap((startTime) => {
    const startMinute = parseStorefrontTime(startTime)
    const oneHourEndMinute = startMinute + 60
    const availableEndTimes = endTimesByStartTime[startTime] ?? []
    const hasOneHourSlot = availableEndTimes.some(
      (endTime: string) => parseStorefrontTime(endTime) === oneHourEndMinute,
    )

    if (!hasOneHourSlot) {
      return []
    }

    return {
      endMinute: oneHourEndMinute,
      isBookable: true,
      startMinute,
    }
  })
}

function normalizeCapacitySegments(
  tuples: readonly RawAvailabilityTuple[],
): readonly CapacitySegment[] {
  return tuples.map(([startMinute, endMinute, freeCapacity]) => ({
    endMinute,
    freeCapacity,
    startMinute,
  }))
}

function parseStorefrontTime(value: string): number {
  const match = /^(\d{1,2})\.(\d{2})(?:\+(\d+))?$/.exec(value)

  if (!match) {
    throw new Error(
      `Storefront time must be HH.mm or HH.mm+N, received "${value}"`,
    )
  }

  const [, hour, minute, dayOffset = '0'] = match
  const parsedHour = Number(hour)
  const parsedMinute = Number(minute)
  const parsedDayOffset = Number(dayOffset)

  if (
    Number.isNaN(parsedHour) ||
    Number.isNaN(parsedMinute) ||
    Number.isNaN(parsedDayOffset)
  ) {
    throw new Error(`Storefront time must be numeric, received "${value}"`)
  }

  if (parsedMinute >= 60) {
    throw new Error(
      `Storefront time minute must be below 60, received "${value}"`,
    )
  }

  return parsedHour * 60 + parsedMinute + parsedDayOffset * 24 * 60
}

function isRawAvailableDateTuple(
  value: unknown,
): value is RawAvailableDateTuple {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  )
}

function isRawAvailabilityTuple(value: unknown): value is RawAvailabilityTuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => typeof entry === 'number')
  )
}

function isRawAvailabilityTupleList(
  value: unknown,
): value is readonly RawAvailabilityTuple[] {
  return Array.isArray(value) && value.every(isRawAvailabilityTuple)
}

function isRawEndTimesByStartTime(
  value: unknown,
): value is RawEndTimesByStartTime {
  return (
    !Array.isArray(value) &&
    isRecord(value) &&
    Object.values(value).every(isStringArray)
  )
}

function isValidRawEndTimes(
  value: unknown,
): value is RawAvailableTimesResponse['endtimes'] {
  return isStringArray(value) || isRawEndTimesByStartTime(value)
}

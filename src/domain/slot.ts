import type { CableId } from './cable'

export type AvailableDate = {
  cableId: CableId
  date: string
  hasBookableSlots: boolean
}

export type BookingSegment = {
  startMinute: number
  endMinute: number
  isBookable: boolean
}

export type CapacitySegment = {
  startMinute: number
  endMinute: number
  freeCapacity: number
}

export type TimeOptionsByStartTime = Readonly<Record<string, readonly string[]>>

export type DailyAvailabilityWindow = {
  cableId: CableId
  date: string
  startTimes: readonly string[]
  endTimesByStartTime: TimeOptionsByStartTime
  bookingSegments: readonly BookingSegment[]
  tomorrowBookingSegments: readonly BookingSegment[]
  capacitySegments: readonly CapacitySegment[]
  tomorrowCapacitySegments: readonly CapacitySegment[]
}

export type AvailabilitySnapshot = {
  cableId: CableId
  anchorDate: string
  availableDates: readonly AvailableDate[]
  dailyWindow: DailyAvailabilityWindow
}

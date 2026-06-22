import type { LocalDateString } from '../lib/date'
import type { CableId } from './cable'

export type AvailableDate = {
  cableId: CableId
  date: LocalDateString
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

export type DailyAvailabilityWindow = {
  cableId: CableId
  date: LocalDateString
  bookingSegments: readonly BookingSegment[]
  capacitySegments: readonly CapacitySegment[]
}

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
  occupiedCapacity: number
}

export type DailyAvailabilityWindow = {
  cableId: CableId
  date: string
  bookingSegments: readonly BookingSegment[]
  capacitySegments: readonly CapacitySegment[]
}

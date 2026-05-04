import type { BookingSlotSelection } from '../../domain/booking'

export type AvailabilitySlot = {
  endTime: string
  freeCapacity: number
  id: string
  selection: BookingSlotSelection
  startTime: string
  totalCapacity: number
}

export type AvailabilityDayGroup = {
  date: string
  displayDate: string
  slots: readonly AvailabilitySlot[]
}

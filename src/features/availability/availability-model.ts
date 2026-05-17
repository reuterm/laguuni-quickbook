import type { BookingSlotSelection } from '../../domain/booking'
import type { LocalDateString } from '../../lib/date'

export type AvailabilitySlot = {
  endTime: string
  freeCapacity: number
  id: string
  selection: BookingSlotSelection
  startTime: string
  totalCapacity: number
}

export type AvailabilityDayGroup = {
  date: LocalDateString
  displayDate: string
  slots: readonly AvailabilitySlot[]
}

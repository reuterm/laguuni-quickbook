import type { BookingSlotSelection } from '../../domain/booking'

export type AvailabilitySlot = {
  availabilityLabel: string
  endTime: string
  id: string
  selection: BookingSlotSelection
  startTime: string
}

export type AvailabilityDayGroup = {
  date: string
  displayDate: string
  slots: readonly AvailabilitySlot[]
}

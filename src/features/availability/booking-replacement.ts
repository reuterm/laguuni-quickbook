import type { BookingSlotSelection } from '../../domain/booking'
import { getCableById } from '../../domain/cable'
import { formatBookingSelectionDate } from '../booking/booking-selection-label'

export type PendingBookingReplacement = {
  current: BookingSlotSelection
  proposed: BookingSlotSelection
}

export function getSelectionForDate(
  selections: readonly BookingSlotSelection[],
  date: BookingSlotSelection['date'],
) {
  return selections.find((selection) => selection.date === date)
}

export function getBookingReplacementMessage({
  current,
  proposed,
}: PendingBookingReplacement) {
  return `Replace ${getCableById(current.cableId).label} ${current.startTime}-${current.endTime} on ${formatBookingSelectionDate(current.date)} with ${getCableById(proposed.cableId).label} ${proposed.startTime}-${proposed.endTime}?`
}

import type { BookingSlotSelection } from '../../domain/booking'
import { getCableById } from '../../domain/cable'
import { formatBookingSelectionDate } from '../booking/booking-selection-label'

export type PendingBookingReplacement = {
  current: BookingSlotSelection
  proposed: BookingSlotSelection
}

export type BookingReplacementDecision =
  | { kind: 'add' }
  | {
      current: BookingSlotSelection
      kind: 'confirm-replacement'
    }

export function getSelectionForDate(
  selections: readonly BookingSlotSelection[],
  date: BookingSlotSelection['date'],
) {
  return selections.find((selection) => selection.date === date)
}

export function getBookingReplacementDecision(
  selections: readonly BookingSlotSelection[],
  proposed: BookingSlotSelection,
): BookingReplacementDecision {
  const current = getSelectionForDate(selections, proposed.date)

  if (current === undefined || current.cableId === proposed.cableId) {
    return { kind: 'add' }
  }

  return { current, kind: 'confirm-replacement' }
}

export function getBookingReplacementMessage({
  current,
  proposed,
}: PendingBookingReplacement) {
  return `Replace ${getCableById(current.cableId).label} ${current.startTime}-${current.endTime} on ${formatBookingSelectionDate(current.date)} with ${getCableById(proposed.cableId).label} ${proposed.startTime}-${proposed.endTime}?`
}

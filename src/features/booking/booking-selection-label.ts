import type { BookingSlotSelection } from '../../domain/booking'
import { getCableById } from '../../domain/cable'
import type { LocalDateString } from '../../lib/date'
import { parseLocalDate } from '../../lib/date'

export type BookingSelectionPresentation = {
  label: string
  rows: Array<{
    label: string
    value: string
  }>
}

const bookingSelectionDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
})

export function getBookingSelectionPresentation(
  selection: BookingSlotSelection,
): BookingSelectionPresentation {
  return {
    label: formatBookingSelectionLabel(selection),
    rows: [
      {
        label: 'Cable',
        value: getCableById(selection.cableId).label,
      },
      {
        label: 'Date',
        value: formatBookingSelectionDate(selection.date),
      },
      {
        label: 'Time',
        value: `${selection.startTime}-${selection.endTime}`,
      },
    ],
  }
}

export function formatBookingSelectionLabel(
  selection: BookingSlotSelection,
): string {
  const cable = getCableById(selection.cableId)

  return `${cable.label} on ${formatBookingSelectionDate(selection.date)} at ${selection.startTime}-${selection.endTime}`
}

export function formatBookingSelectionDate(date: LocalDateString): string {
  return bookingSelectionDateFormatter.format(parseLocalDate(date))
}

import type { BookingSlotSelection } from '../../domain/booking'
import { getCableById } from '../../domain/cable'
import { parseLocalDate } from '../../lib/date'

export type BookingSelectionsPresentation = {
  label: string
  rows: readonly {
    cableLabel: string
    dateLabel: string
    timeLabel: string
  }[]
}

const bookingSelectionDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
})

export function getBookingSlotSelectionKey(
  selection: BookingSlotSelection,
): string {
  return `${selection.cableId}:${selection.date}:${selection.startTime}:${selection.endTime}`
}

export function getBookingSelectionsPresentation(
  selections: readonly BookingSlotSelection[],
): BookingSelectionsPresentation {
  const sortedSelections = [...selections].sort((left, right) =>
    `${left.date}:${left.startTime}:${left.endTime}`.localeCompare(
      `${right.date}:${right.startTime}:${right.endTime}`,
    ),
  )

  return {
    label: `${sortedSelections.length} ${sortedSelections.length === 1 ? 'slot' : 'slots'}`,
    rows: sortedSelections.map((selection) => ({
      cableLabel: getCableById(selection.cableId).label,
      dateLabel: formatBookingSelectionDate(selection.date),
      timeLabel: `${selection.startTime}-${selection.endTime}`,
    })),
  }
}

function formatBookingSelectionDate(
  date: BookingSlotSelection['date'],
): string {
  const parts = bookingSelectionDateFormatter.formatToParts(
    parseLocalDate(date),
  )
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  const month = parts.find((part) => part.type === 'month')?.value

  return `${weekday}, ${day} ${month}`
}

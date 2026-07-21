import { Button } from '@/components/ui/button'
import type { BookingSlotSelection } from '@/domain/booking'
import { getCableById } from '@/domain/cable'
import { formatBookingSelectionDate } from '../../booking/booking-selection-label'
import {
  getBookingSlotSelectionKey,
  sortBookingSlotSelections,
} from '../../booking/booking-selections'

type BookingBasketTrayProps = {
  selections: readonly BookingSlotSelection[]
  onReview: () => void
  onClear: () => void
}

export function BookingBasketTray({
  selections,
  onReview,
  onClear,
}: BookingBasketTrayProps) {
  const sortedSelections = sortBookingSlotSelections(selections)

  if (sortedSelections.length === 0) {
    return null
  }

  return (
    <div aria-live="polite" className="space-y-3">
      <p>
        {sortedSelections.length} slot
        {sortedSelections.length === 1 ? '' : 's'} selected
      </p>
      <ul className="space-y-1">
        {sortedSelections.map((selection) => (
          <li key={getBookingSlotSelectionKey(selection)}>
            {getCableById(selection.cableId).label} -{' '}
            {formatBookingSelectionDate(selection.date)} - {selection.startTime}
            -{selection.endTime}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onReview}>
          Review selected slots
        </Button>
        <Button type="button" variant="secondary" onClick={onClear}>
          Clear selection
        </Button>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import type { BookingSlotSelection } from '@/domain/booking'

type BookingBasketTrayProps = {
  selections: readonly BookingSlotSelection[]
  onReview: () => void
}

export function BookingBasketTray({ selections, onReview }: BookingBasketTrayProps) {
  const selectedCount = selections.length

  if (selectedCount === 0) return null

  return (
    <Button className="w-full sm:w-auto" type="button" onClick={onReview}>
      {selectedCount} slot{selectedCount === 1 ? '' : 's'} selected
    </Button>
  )
}

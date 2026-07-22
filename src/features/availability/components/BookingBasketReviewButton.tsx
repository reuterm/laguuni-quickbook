import { Button } from '@/components/ui/button'
import type { BookingSlotSelection } from '@/domain/booking'

type BookingBasketReviewButtonProps = {
  selections: readonly BookingSlotSelection[]
  onReview: () => void
}

export function BookingBasketReviewButton({
  selections,
  onReview,
}: BookingBasketReviewButtonProps) {
  if (selections.length === 0) return null

  return (
    <Button
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 -translate-x-1/2 rounded-full px-5 shadow-lg"
      type="button"
      onClick={onReview}
    >
      Review selection
    </Button>
  )
}

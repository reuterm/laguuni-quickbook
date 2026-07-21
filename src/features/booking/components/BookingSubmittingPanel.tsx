import { LoaderCircle } from 'lucide-react'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

type BookingSubmittingPanelProps = {
  selectionsCount: number
}

export function BookingSubmittingPanel({
  selectionsCount,
}: BookingSubmittingPanelProps) {
  return (
    <BookingStatePanel
      body={`Booking ${selectionsCount} ${selectionsCount === 1 ? 'slot' : 'slots'} through the storefront flow.`}
      icon={LoaderCircle}
      iconClassName="animate-spin text-muted-foreground"
      role="status"
      toneClassName={bookingNeutralToneClassName}
      title="Booking in progress"
    />
  )
}

import { LoaderCircle } from 'lucide-react'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

type BookingSubmittingPanelProps = {
  selectionLabel: string
}

export function BookingSubmittingPanel({
  selectionLabel,
}: BookingSubmittingPanelProps) {
  return (
    <BookingStatePanel
      body={`Submitting ${selectionLabel} through the storefront flow.`}
      icon={LoaderCircle}
      iconClassName="animate-spin text-muted-foreground"
      role="status"
      toneClassName={bookingNeutralToneClassName}
      title="Booking in progress"
    />
  )
}

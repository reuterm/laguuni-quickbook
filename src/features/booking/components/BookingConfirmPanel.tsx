import { Button } from '@/components/ui/button'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

type BookingConfirmPanelProps = {
  onConfirm: () => Promise<void>
}

export function BookingConfirmPanel({ onConfirm }: BookingConfirmPanelProps) {
  return (
    <BookingStatePanel
      body="Ready to place this booking?"
      actions={
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            void onConfirm()
          }}
        >
          Confirm booking
        </Button>
      }
      toneClassName={bookingNeutralToneClassName}
      title="Confirm booking"
    />
  )
}

import { Button } from '@/components/ui/button'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

type BookingConfirmPanelProps = {
  onConfirm: () => Promise<void>
  secondaryAction?: { label: string; onClick: () => void }
}

export function BookingConfirmPanel({
  onConfirm,
  secondaryAction,
}: BookingConfirmPanelProps) {
  return (
    <BookingStatePanel
      body="Ready to place this booking?"
      actions={
        <div className="grid gap-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              void onConfirm()
            }}
          >
            Confirm booking
          </Button>
          {secondaryAction ? (
            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      }
      toneClassName={bookingNeutralToneClassName}
      title="Confirm booking"
    />
  )
}

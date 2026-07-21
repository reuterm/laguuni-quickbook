import { Button } from '@/components/ui/button'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

type BookingConfirmPanelProps = {
  onAddMore?: (() => void) | undefined
  onClearSelection?: (() => void) | undefined
  onConfirm: () => Promise<void>
}

export function BookingConfirmPanel({
  onAddMore,
  onClearSelection,
  onConfirm,
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
          {onAddMore !== undefined ? (
            <Button type="button" variant="secondary" onClick={onAddMore}>
              Add more
            </Button>
          ) : null}
          {onClearSelection ? (
            <Button
              type="button"
              className="w-full"
              onClick={onClearSelection}
              variant="secondary"
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      }
      toneClassName={bookingNeutralToneClassName}
      title="Confirm booking"
    />
  )
}

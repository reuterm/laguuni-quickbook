import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  getBookingReplacementMessage,
  type PendingBookingReplacement,
} from '../booking-replacement'

type BookingReplacementSheetProps = {
  pendingReplacement: PendingBookingReplacement | null
  onKeepCurrentSelection: () => void
  onReplace: () => void
}

export function BookingReplacementSheet({
  pendingReplacement,
  onKeepCurrentSelection,
  onReplace,
}: BookingReplacementSheetProps) {
  if (pendingReplacement === null) {
    return null
  }

  const replacementMessage = getBookingReplacementMessage(pendingReplacement)

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onKeepCurrentSelection()
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-[2rem] px-5 pb-7 pt-6 sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="pr-10 text-left">
          <SheetTitle>Replace selected slot?</SheetTitle>
          <SheetDescription>{replacementMessage}</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onKeepCurrentSelection}
          >
            Keep current
          </Button>
          <Button type="button" onClick={onReplace}>
            Replace
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

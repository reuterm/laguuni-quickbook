import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import type { BookingSlotSelection } from '../../../domain/booking'
import type { AvailabilityDayGroup } from '../availability-service'

type AvailabilityDayGroupsProps = {
  dayGroups: readonly AvailabilityDayGroup[]
  onBookSelection?: ((selection: BookingSlotSelection) => void) | undefined
  showBookingActions?: boolean
}

export function AvailabilityDayGroups({
  dayGroups,
  onBookSelection,
  showBookingActions = true,
}: AvailabilityDayGroupsProps) {
  return (
    <div className="grid gap-4">
      {dayGroups.map((dayGroup) => (
        <Card
          key={dayGroup.date}
          className="border-border/70 bg-card shadow-none"
        >
          <CardHeader className="gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-lg font-semibold">{dayGroup.displayDate}</h3>
            <p className="text-sm text-muted-foreground">
              {dayGroup.slots.length} bookable{' '}
              {dayGroup.slots.length === 1 ? 'slot' : 'slots'}
            </p>
          </CardHeader>

          <CardContent className="grid gap-2 pt-4">
            {dayGroup.slots.map((slot) => (
              <article
                key={slot.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-foreground">
                    {slot.startTime}-{slot.endTime}
                  </span>
                  <span className="text-muted-foreground">
                    {slot.availabilityLabel}
                  </span>
                </div>

                {showBookingActions ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={onBookSelection === undefined}
                    onClick={() => onBookSelection?.(slot.selection)}
                  >
                    Book
                  </Button>
                ) : null}
              </article>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

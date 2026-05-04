import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { eyebrowClassName } from '@/components/ui/styles'
import { SurfaceList, SurfaceListItem } from '@/components/ui/surface-list'

import type { AvailabilityDayGroup } from '../availability-service'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

type AvailabilityDayGroupsProps = {
  dayGroups: readonly AvailabilityDayGroup[]
} & AvailabilityBookingActionProps

export function AvailabilityDayGroups({
  bookingActionMode,
  dayGroups,
  onBookSelection,
}: AvailabilityDayGroupsProps) {
  return (
    <div className="grid gap-6">
      {dayGroups.map((dayGroup) => (
        <section key={dayGroup.date} className="space-y-3">
          <SectionHeader
            className="px-1"
            contentClassName="space-y-0"
            title={dayGroup.displayDate}
            titleAs="h3"
            titleClassName="text-lg"
            actions={
              <p className={eyebrowClassName}>
                {dayGroup.slots.length} bookable{' '}
                {dayGroup.slots.length === 1 ? 'slot' : 'slots'}
              </p>
            }
          />

          <SurfaceList>
            {dayGroup.slots.map((slot) => (
              <SurfaceListItem key={slot.id}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-semibold tabular-nums text-foreground">
                      {slot.startTime}-{slot.endTime}
                    </span>
                    <span className="text-muted-foreground">
                      {slot.availabilityLabel}
                    </span>
                  </div>
                </div>

                {bookingActionMode === 'hidden' ? (
                  <span className={eyebrowClassName}>Read only</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:min-w-[6.5rem] sm:w-auto"
                    disabled={bookingActionMode === 'disabled'}
                    onClick={
                      bookingActionMode === 'enabled'
                        ? () => onBookSelection(slot.selection)
                        : undefined
                    }
                  >
                    Book
                  </Button>
                )}
              </SurfaceListItem>
            ))}
          </SurfaceList>
        </section>
      ))}
    </div>
  )
}

export type { AvailabilityBookingActionProps, AvailabilityDayGroupsProps }

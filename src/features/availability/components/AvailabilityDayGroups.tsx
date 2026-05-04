import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { eyebrowClassName, subtleDividerClassName } from '@/components/ui/styles'
import { SurfaceList, SurfaceListItem } from '@/components/ui/surface-list'
import { cn } from '@/lib/utils'

import type { AvailabilitySlot } from '../availability-model'
import type { AvailabilityDayGroup } from '../availability-service'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

const availabilityToneClassNames = {
  high: 'border-transparent bg-[#008d2c]/20 text-[#4bd37a]',
  low: 'border-transparent bg-[#9b5c49]/20 text-[#d69580]',
  medium: 'border-transparent bg-[#8a7d2e]/20 text-[#d2c56d]',
  neutral: 'border-transparent bg-muted/55 text-muted-foreground',
} as const

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
            className="items-center px-1"
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
                    <AvailabilityBadge slot={slot} />
                  </div>
                </div>

                {bookingActionMode === 'hidden' ? (
                  <span className={eyebrowClassName}>Read only</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className={cn(
                      'w-full border sm:min-w-[6.5rem] sm:w-auto',
                      subtleDividerClassName,
                    )}
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

function AvailabilityBadge({ slot }: { slot: AvailabilitySlot }) {
  const occupancyClassName = getAvailabilityToneClassName(
    slot.freeCapacity,
    slot.totalCapacity,
  )

  return (
    <Badge
      variant="outline"
      className={cn(
        'px-2 py-0.5 font-medium tabular-nums transition-colors',
        occupancyClassName,
      )}
    >
      {slot.freeCapacity}/{slot.totalCapacity}
    </Badge>
  )
}

function getAvailabilityToneClassName(
  freeCapacity: number,
  totalCapacity: number,
) {
  if (totalCapacity <= 0) {
    return availabilityToneClassNames.neutral
  }

  const availabilityRatio = freeCapacity / totalCapacity

  if (availabilityRatio <= 0.25) {
    return availabilityToneClassNames.low
  }

  if (availabilityRatio <= 0.5) {
    return availabilityToneClassNames.medium
  }

  return availabilityToneClassNames.high
}

export type { AvailabilityBookingActionProps, AvailabilityDayGroupsProps }

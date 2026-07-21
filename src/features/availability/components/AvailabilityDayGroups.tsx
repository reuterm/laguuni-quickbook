import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import {
  eyebrowClassName,
  subtleDividerClassName,
} from '@/components/ui/styles'
import { SurfaceList, SurfaceListItem } from '@/components/ui/surface-list'
import { cn } from '@/lib/utils'
import type { BookingSlotSelection } from '../../../domain/booking'
import type { AvailabilityDayGroup } from '../availability-service'
import { AvailabilityCapacityChip } from './availability-badge'

const availabilityDayGroupsClassName = 'space-y-6'
const availabilityBookingButtonMinWidth = '6.5rem'

const availabilityBookingButtonClassName =
  'shrink-0 border hover:border-border/90 hover:bg-white/[0.08]'

type AvailabilitySlotAction =
  | {
      kind: 'booking'
      mode: 'hidden'
    }
  | {
      kind: 'booking'
      mode: 'enabled' | 'disabled'
      onBookSelection: (selection: BookingSlotSelection) => void
    }
  | {
      isSelected: (selection: BookingSlotSelection) => boolean
      kind: 'selection'
      onAddSelection: (selection: BookingSlotSelection) => void
      onRemoveSelection: (selection: BookingSlotSelection) => void
    }

type AvailabilityDayGroupsProps = {
  dayGroups: readonly AvailabilityDayGroup[]
  slotAction: AvailabilitySlotAction
}

function renderSlotAction(
  slot: AvailabilityDayGroup['slots'][number],
  slotAction: AvailabilitySlotAction,
) {
  if (slotAction.kind === 'selection') {
    const selected = slotAction.isSelected(slot.selection)

    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className={cn(
          availabilityBookingButtonClassName,
          subtleDividerClassName,
        )}
        style={{ minWidth: availabilityBookingButtonMinWidth }}
        aria-pressed={selected}
        aria-label={`${selected ? 'Remove' : 'Add'} ${slot.startTime}-${slot.endTime}, ${slot.freeCapacity} spots free`}
        onClick={() =>
          (selected ? slotAction.onRemoveSelection : slotAction.onAddSelection)(
            slot.selection,
          )
        }
      >
        {selected ? 'Remove' : 'Add'}
      </Button>
    )
  }

  if (slotAction.mode === 'hidden') {
    return <span className={eyebrowClassName}>Read only</span>
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={cn(availabilityBookingButtonClassName, subtleDividerClassName)}
      style={{ minWidth: availabilityBookingButtonMinWidth }}
      disabled={slotAction.mode === 'disabled'}
      onClick={() => slotAction.onBookSelection(slot.selection)}
    >
      Book
    </Button>
  )
}

export function AvailabilityDayGroups({
  dayGroups,
  slotAction,
}: AvailabilityDayGroupsProps) {
  return (
    <div className={availabilityDayGroupsClassName}>
      {dayGroups.map((dayGroup) => (
        <section key={dayGroup.date} className="min-w-0 self-start space-y-3">
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
              <SurfaceListItem key={slot.id} layout="inline">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-semibold tabular-nums text-foreground">
                      {slot.startTime}-{slot.endTime}
                    </span>
                    <AvailabilityCapacityChip slot={slot} />
                  </div>
                </div>
                {renderSlotAction(slot, slotAction)}
              </SurfaceListItem>
            ))}
          </SurfaceList>
        </section>
      ))}
    </div>
  )
}

export type { AvailabilityDayGroupsProps, AvailabilitySlotAction }

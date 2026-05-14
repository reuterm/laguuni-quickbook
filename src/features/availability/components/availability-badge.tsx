import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { AvailabilitySlot } from '../availability-model'

const availabilityToneClassNames = {
  high: 'border-transparent bg-[#008d2c]/20 text-[#4bd37a]',
  medium: 'border-transparent bg-[#8a7d2e]/20 text-[#d2c56d]',
  neutral: 'border-transparent bg-muted/55 text-muted-foreground',
  low: 'border-transparent bg-[#9b5c49]/20 text-[#d69580]',
} as const

type AvailabilityBadgeProps = {
  className?: string
  slot: AvailabilitySlot
}

type AvailabilityBadgeButtonProps = {
  className?: string
  disabled?: boolean
  onClick?: () => void
  slot: AvailabilitySlot
}

type AvailabilityCapacityChipProps =
  | {
      className?: string
      disabled?: boolean
      onClick: () => void
      slot: AvailabilitySlot
    }
  | {
      className?: string
      disabled?: never
      onClick?: never
      slot: AvailabilitySlot
    }

export function AvailabilityBadge({ className, slot }: AvailabilityBadgeProps) {
  return (
    <Badge className={cn(getAvailabilityBadgeClassName(slot), className)}>
      {getAvailabilityBadgeLabel(slot)}
    </Badge>
  )
}

export function AvailabilityBadgeButton({
  className,
  disabled = false,
  onClick,
  slot,
}: AvailabilityBadgeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'h-auto min-w-11 rounded-full border px-2.5 py-1 font-medium tabular-nums focus-visible:ring-offset-0',
        getAvailabilityToneClassName(slot.freeCapacity, slot.totalCapacity),
        !disabled &&
          'hover:brightness-110 hover:saturate-125 active:brightness-95',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      aria-label={`Book ${slot.startTime}-${slot.endTime}, ${getAvailabilityBadgeLabel(slot)} spots free`}
      type="button"
    >
      {getAvailabilityBadgeLabel(slot)}
    </Button>
  )
}

export function AvailabilityCapacityChip({
  className,
  disabled,
  onClick,
  slot,
}: AvailabilityCapacityChipProps) {
  if (onClick === undefined) {
    return (
      <AvailabilityBadge {...(className ? { className } : {})} slot={slot} />
    )
  }

  return (
    <AvailabilityBadgeButton
      slot={slot}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(className ? { className } : {})}
      onClick={onClick}
    />
  )
}

function getAvailabilityBadgeLabel(slot: AvailabilitySlot) {
  return `${slot.freeCapacity}/${slot.totalCapacity}`
}

function getAvailabilityBadgeClassName(slot: AvailabilitySlot) {
  return cn(
    'px-2 py-0.5 font-medium tabular-nums transition-colors',
    getAvailabilityToneClassName(slot.freeCapacity, slot.totalCapacity),
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

export { getAvailabilityToneClassName }

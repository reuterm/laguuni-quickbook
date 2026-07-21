import { cn } from '@/lib/utils'

import type { AvailabilitySlot } from '../availability-model'

const availabilityToneClassNames = {
  high: 'border-transparent bg-[#008d2c]/20 text-[#4bd37a]',
  elevated: 'border-transparent bg-[#1b6f77]/20 text-[#6edce6]',
  medium: 'border-transparent bg-[#8a7d2e]/20 text-[#d2c56d]',
  neutral: 'border-transparent bg-muted/55 text-muted-foreground',
  low: 'border-transparent bg-[#9b5c49]/20 text-[#d69580]',
} as const

const availabilityChipBaseClassName =
  'inline-flex min-w-11 items-center justify-center rounded-full border px-2.5 py-1 text-center text-sm font-medium tabular-nums'

const availabilityChipInteractiveClassName =
  'h-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50'

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

export function AvailabilityCapacityChip({
  className,
  disabled,
  onClick,
  slot,
}: AvailabilityCapacityChipProps) {
  const chipClassName = cn(
    getAvailabilityChipClassName(slot),
    onClick !== undefined && availabilityChipInteractiveClassName,
    className,
  )

  if (onClick === undefined) {
    return (
      <span className={chipClassName}>{getAvailabilityBadgeLabel(slot)}</span>
    )
  }

  return (
    <button
      className={chipClassName}
      disabled={disabled}
      onClick={onClick}
      aria-label={`Book ${slot.startTime}-${slot.endTime}, ${getAvailabilityBadgeLabel(slot)} spots free`}
      type="button"
    >
      {getAvailabilityBadgeLabel(slot)}
    </button>
  )
}

function getAvailabilityBadgeLabel(slot: AvailabilitySlot) {
  return `${slot.freeCapacity}`
}

function getAvailabilityChipClassName(slot: AvailabilitySlot) {
  return cn(
    availabilityChipBaseClassName,
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

  if (availabilityRatio <= 0.75) {
    return availabilityToneClassNames.elevated
  }

  return availabilityToneClassNames.high
}

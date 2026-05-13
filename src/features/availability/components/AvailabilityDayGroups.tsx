import { useCallback, useLayoutEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import {
  eyebrowClassName,
  subtleDividerClassName,
} from '@/components/ui/styles'
import { SurfaceList, SurfaceListItem } from '@/components/ui/surface-list'
import { cn } from '@/lib/utils'

import type { AvailabilitySlot } from '../availability-model'
import type { AvailabilityDayGroup } from '../availability-service'
import type { AvailabilityBookingActionProps } from './availability-booking-action'

const availabilityToneClassNames = {
  high: 'border-transparent bg-[#008d2c]/20 text-[#4bd37a]',
  medium: 'border-transparent bg-[#8a7d2e]/20 text-[#d2c56d]',
  neutral: 'border-transparent bg-muted/55 text-muted-foreground',
  low: 'border-transparent bg-[#9b5c49]/20 text-[#d69580]',
} as const

const availabilityDayLayout = {
  // This matches the smallest viable single-column day card at a 320px viewport.
  cardMinWidthRem: 18,
  gapRem: 1.5,
  slotActionMinWidthRem: 6.5,
} as const

const availabilityDayLayoutStyles = {
  cardMinWidth: `${availabilityDayLayout.cardMinWidthRem}rem`,
  gap: `${availabilityDayLayout.gapRem}rem`,
  slotActionMinWidth: `${availabilityDayLayout.slotActionMinWidthRem}rem`,
} as const

type AvailabilityDayGroupsProps = {
  dayGroups: readonly AvailabilityDayGroup[]
} & AvailabilityBookingActionProps

export function AvailabilityDayGroups({
  bookingActionMode,
  dayGroups,
  onBookSelection,
}: AvailabilityDayGroupsProps) {
  const { containerRef, containerWidth, rootFontSizePx } = useElementMetrics()
  const columnCount = getBalancedDayColumnCount(
    dayGroups.length,
    containerWidth,
    rootFontSizePx,
  )

  return (
    <div
      ref={containerRef}
      className="grid items-start"
      style={{
        gap: availabilityDayLayoutStyles.gap,
        gridTemplateColumns: `repeat(${columnCount}, minmax(min(${availabilityDayLayoutStyles.cardMinWidth}, 100%), 1fr))`,
      }}
    >
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
                      'shrink-0 border',
                      subtleDividerClassName,
                    )}
                    style={{
                      minWidth: availabilityDayLayoutStyles.slotActionMinWidth,
                    }}
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

function useElementMetrics<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [width, setWidth] = useState(0)
  const [rootFontSizePx, setRootFontSizePx] = useState(16)

  const containerRef = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  useLayoutEffect(() => {
    if (!element) {
      return undefined
    }

    const updateMetrics = () => {
      setWidth(element.getBoundingClientRect().width)
      const nextRootFontSizePx = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      )

      if (Number.isFinite(nextRootFontSizePx) && nextRootFontSizePx > 0) {
        setRootFontSizePx(nextRootFontSizePx)
      }
    }

    updateMetrics()

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [element])

  return {
    containerRef,
    containerWidth: width,
    rootFontSizePx,
  }
}

function getBalancedDayColumnCount(
  dayCount: number,
  containerWidth: number,
  rootFontSizePx: number = 16,
) {
  if (dayCount <= 1 || containerWidth <= 0) {
    return 1
  }

  const minCardWidthPx = availabilityDayLayout.cardMinWidthRem * rootFontSizePx
  const gapPx = availabilityDayLayout.gapRem * rootFontSizePx
  const maxColumnsThatFit = Math.max(
    1,
    Math.min(
      dayCount,
      Math.floor((containerWidth + gapPx) / (minCardWidthPx + gapPx)),
    ),
  )

  if (maxColumnsThatFit > 2 && dayCount % maxColumnsThatFit === 1) {
    return maxColumnsThatFit - 1
  }

  return maxColumnsThatFit
}

function AvailabilityBadge({ slot }: { slot: AvailabilitySlot }) {
  const occupancyClassName = getAvailabilityToneClassName(
    slot.freeCapacity,
    slot.totalCapacity,
  )

  return (
    <Badge
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

export { getBalancedDayColumnCount }

import type * as React from 'react'

import { cn } from '@/lib/utils'

import { Tabs, TabsList, TabsTrigger } from './tabs'

type SegmentedControlItem<Value extends string = string> = {
  disabled?: boolean
  labelClassName?: string
  label: React.ReactNode
  value: Value
}

type SegmentedControlProps<Value extends string = string> = {
  ariaLabel?: string
  ariaLabelledBy?: string
  className?: string
  items: readonly SegmentedControlItem<Value>[]
  layout?: 'auto' | 'fill'
  listClassName?: string
  listOptions?: Omit<
    React.ComponentProps<typeof TabsList>,
    'children' | 'className' | 'style'
  >
  itemClassName?: string
  itemMinWidthClassName?: string
  onValueChange: (value: Value) => void
  value: Value
}

function SegmentedControl<Value extends string>({
  ariaLabel,
  ariaLabelledBy,
  className,
  items,
  layout = 'fill',
  itemClassName,
  itemMinWidthClassName = 'min-w-0',
  listClassName,
  listOptions,
  onValueChange,
  value,
}: SegmentedControlProps<Value>) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        if (isSegmentedControlValue(items, nextValue)) {
          onValueChange(nextValue)
        }
      }}
      className={cn('w-full', className)}
    >
      <TabsList
        {...listOptions}
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        {...(ariaLabelledBy !== undefined
          ? { 'aria-labelledby': ariaLabelledBy }
          : {})}
        className={cn(
          layout === 'fill'
            ? 'grid h-auto w-full'
            : 'inline-flex h-auto w-full',
          listClassName,
        )}
        style={
          layout === 'fill'
            ? {
                gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
              }
            : undefined
        }
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            disabled={item.disabled}
            value={item.value}
            className={cn(
              itemMinWidthClassName,
              'min-h-10 px-4 py-2 text-center',
              itemClassName,
            )}
          >
            <span className={cn('font-medium', item.labelClassName)}>
              {item.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function isSegmentedControlValue<Value extends string>(
  items: readonly SegmentedControlItem<Value>[],
  value: string,
): value is Value {
  return items.some((item) => item.value === value)
}

export type { SegmentedControlItem }
export { SegmentedControl }

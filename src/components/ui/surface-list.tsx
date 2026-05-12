import type * as React from 'react'

import { cn } from '@/lib/utils'

import { listSurfaceClassName, subtleHoverSurfaceClassName } from './styles'

type SurfaceListProps<Element extends React.ElementType> = {
  as?: Element
  divided?: boolean
} & Omit<React.ComponentPropsWithoutRef<Element>, 'as' | 'className'> & {
    className?: string
  }

function SurfaceList<Element extends React.ElementType = 'div'>({
  as,
  className,
  divided = true,
  ...props
}: SurfaceListProps<Element>) {
  const Comp = as ?? 'div'

  return (
    <Comp
      className={cn(
        divided && 'divide-y divide-border/70',
        listSurfaceClassName,
        className,
      )}
      {...props}
    />
  )
}

type SurfaceListItemProps<Element extends React.ElementType> = {
  as?: Element
  interactive?: boolean
  layout?: 'inline' | 'responsive'
} & Omit<React.ComponentPropsWithoutRef<Element>, 'as' | 'className'> & {
    className?: string
  }

function SurfaceListItem<Element extends React.ElementType = 'div'>({
  as,
  className,
  interactive = false,
  layout = 'responsive',
  ...props
}: SurfaceListItemProps<Element>) {
  const Comp = as ?? 'div'

  return (
    <Comp
      className={cn(
        layout === 'inline'
          ? 'flex items-center justify-between gap-3 px-4 py-4'
          : 'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        interactive && subtleHoverSurfaceClassName,
        className,
      )}
      {...props}
    />
  )
}

export { SurfaceList, SurfaceListItem }

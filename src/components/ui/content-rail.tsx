import type * as React from 'react'

import { cn } from '@/lib/utils'

const contentRailSizeClassNames = {
  narrow: 'max-w-4xl sm:px-2',
  page: 'max-w-7xl',
} as const

type ContentRailProps = React.ComponentProps<'div'> & {
  size?: keyof typeof contentRailSizeClassNames
}

function ContentRail({
  className,
  size = 'narrow',
  ...props
}: ContentRailProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        contentRailSizeClassNames[size],
        className,
      )}
      {...props}
    />
  )
}

export { ContentRail }

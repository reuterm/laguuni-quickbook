import type * as React from 'react'

import { cn } from '@/lib/utils'

function AlertTitle({
  children,
  className,
  ...props
}: React.ComponentProps<'h5'>) {
  return (
    <h5 className={cn('font-medium tracking-tight', className)} {...props}>
      {children}
    </h5>
  )
}

export { AlertTitle }

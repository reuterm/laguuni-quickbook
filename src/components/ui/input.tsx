import type * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-[color,box-shadow,border-color,background-color] outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      type={type}
      {...props}
    />
  )
}

export { Input }

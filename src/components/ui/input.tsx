import type * as React from 'react'

import { cn } from '@/lib/utils'

import { formControlClassName } from './styles'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        formControlClassName,
        'text-base placeholder:text-muted-foreground/80 md:text-sm',
        className,
      )}
      type={type}
      {...props}
    />
  )
}

export { Input }

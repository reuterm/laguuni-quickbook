import type * as React from 'react'

import { cn } from '@/lib/utils'

import { cardSurfaceClassName } from './styles'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn(cardSurfaceClassName, className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-4 sm:p-5', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4 pt-0 sm:p-5 sm:pt-0', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

export { Card, CardContent, CardDescription, CardHeader }

import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { eyebrowTypographyClassName } from './styles'

const subtleBadgeSurfaceClassName =
  'border-border/70 bg-muted/40 text-foreground/80'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border transition-colors',
  {
    variants: {
      size: {
        default: 'px-2.5 py-0.5 text-xs font-medium',
        eyebrow: `px-2.5 py-1 text-[11px] ${eyebrowTypographyClassName}`,
      },
      variant: {
        default: 'border-border bg-muted/40 text-foreground',
        secondary: 'border-border bg-muted/30 text-foreground',
        outline: 'border-border bg-transparent text-muted-foreground',
        subtle: subtleBadgeSurfaceClassName,
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
)

function Badge({
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ className, size, variant }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

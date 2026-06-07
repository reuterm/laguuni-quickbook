import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { mutedSurfaceClassName, statusToneClassNames } from './styles'

const alertVariants = cva(
  'relative grid w-full gap-1.5 rounded-2xl border px-4 py-3.5 text-sm',
  {
    variants: {
      variant: {
        default: `${mutedSurfaceClassName} text-foreground`,
        destructive: cn(
          'text-foreground',
          statusToneClassNames.destructive.surface,
        ),
        success: cn('text-foreground', statusToneClassNames.success.surface),
        warning: cn('text-foreground', statusToneClassNames.warning.surface),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      className={cn(alertVariants({ className, variant }))}
      role="alert"
      {...props}
    />
  )
}

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-sm text-muted-foreground [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert }

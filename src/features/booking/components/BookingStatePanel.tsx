import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const bookingNeutralToneClassName = 'border-border/70 bg-muted/20'

type BookingStatePanelProps = {
  actions?: React.ReactNode
  body: string
  icon?: LucideIcon
  iconClassName?: string
  role?: 'alert' | 'status'
  toneClassName: string
  title: string
}

export function BookingStatePanel({
  actions,
  body,
  icon: Icon,
  iconClassName,
  role = 'status',
  toneClassName,
  title,
}: BookingStatePanelProps) {
  return (
    <section
      aria-live="polite"
      role={role}
      className={cn(
        'flex min-h-40 flex-col rounded-2xl border p-4 transition-colors sm:min-h-44',
        toneClassName,
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {Icon ? (
            <Icon className={cn('mt-0.5 size-4 shrink-0', iconClassName)} />
          ) : null}
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        </div>
      </div>

      {actions ? <div className="mt-auto pt-4">{actions}</div> : null}
    </section>
  )
}

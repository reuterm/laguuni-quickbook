import type * as React from 'react'

import { cn } from '@/lib/utils'

import { eyebrowClassName as defaultEyebrowClassName } from './styles'

type SectionHeaderProps = {
  actions?: React.ReactNode
  badge?: React.ReactNode
  badgeClassName?: string
  className?: string
  contentClassName?: string
  description?: React.ReactNode
  descriptionClassName?: string
  eyebrow?: React.ReactNode
  eyebrowClassName?: string
  titleId?: string
  title: React.ReactNode
  titleAs?: 'h1' | 'h2' | 'h3' | 'p'
  titleClassName?: string
}

function SectionHeader({
  actions,
  badge,
  badgeClassName,
  className,
  contentClassName,
  description,
  descriptionClassName,
  eyebrow,
  eyebrowClassName,
  titleId,
  title,
  titleAs: TitleTag = 'h2',
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className={cn('min-w-0 space-y-2', contentClassName)}>
        {eyebrow !== undefined || badge !== undefined ? (
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow !== undefined ? (
              <span className={cn(defaultEyebrowClassName, eyebrowClassName)}>
                {eyebrow}
              </span>
            ) : null}
            {badge !== undefined ? (
              <div className={badgeClassName}>{badge}</div>
            ) : null}
          </div>
        ) : null}

        <TitleTag
          id={titleId}
          className={cn(
            'text-balance font-semibold tracking-tight',
            titleClassName,
          )}
        >
          {title}
        </TitleTag>

        {description !== undefined ? (
          <p
            className={cn(
              'text-sm leading-6 text-muted-foreground',
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions}
    </div>
  )
}

export { SectionHeader }

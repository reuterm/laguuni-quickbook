import type { ReactNode } from 'react'

import {
  eyebrowClassName,
  panelSurfaceClassName,
  subtleDividerClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'

import { availabilityCalendarColumnClassNames } from './availability-calendar-ui'

type AvailabilityCalendarTableFrameProps = {
  body: ReactNode
  dayHeaders: readonly ReactNode[]
  label: ReactNode
}

export function AvailabilityCalendarTableFrame({
  body,
  dayHeaders,
  label,
}: AvailabilityCalendarTableFrameProps) {
  return (
    <section className={cn(panelSurfaceClassName, 'overflow-hidden')}>
      <div className="border-b border-border/70 px-4 py-3 sm:px-5">
        <p className={eyebrowClassName}>{label}</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <div className="pb-3 pr-3 pt-3 sm:pb-4 sm:pr-4 sm:pt-4">
          <table className="w-full border-separate border-spacing-0 md:table-fixed">
            <thead>
              <tr>
                <th
                  scope="col"
                  className={cn(
                    subtleSurfaceBackgroundClassName,
                    subtleDividerClassName,
                    availabilityCalendarColumnClassNames.time,
                    'sticky left-0 z-20 border-b border-r px-3 py-3 text-center align-bottom',
                  )}
                >
                  <span className={eyebrowClassName}>Time</span>
                </th>

                {dayHeaders}
              </tr>
            </thead>

            <tbody>{body}</tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

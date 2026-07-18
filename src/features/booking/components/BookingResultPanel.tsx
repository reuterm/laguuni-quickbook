import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { BookingFlowResult } from '../../../domain/booking'
import { DiagnosticsCopyAction } from '../../diagnostics/DiagnosticsCopyAction'
import { getBookingResultPresentation } from '../booking-result-presentation'
import { BookingStatePanel } from './BookingStatePanel'

type BookingResultPanelProps = {
  calendarErrorMessage?: string | null | undefined
  onAddToCalendar?: (() => Promise<void>) | undefined
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  result: BookingFlowResult
  selectionLabel: string
  traceId: string
}

export function BookingResultPanel({
  calendarErrorMessage,
  onAddToCalendar,
  onExportTrace,
  result,
  selectionLabel,
  traceId,
}: BookingResultPanelProps) {
  const presentation = getBookingResultPresentation(result, selectionLabel)

  return (
    <BookingStatePanel
      body={presentation.body}
      actions={
        <BookingResultAction
          calendarErrorMessage={calendarErrorMessage}
          key={traceId}
          action={presentation.action}
          onAddToCalendar={
            result.status === 'success' ? onAddToCalendar : undefined
          }
          onExportTrace={onExportTrace}
          traceId={traceId}
        />
      }
      icon={presentation.icon}
      iconClassName={presentation.iconClassName}
      role={presentation.role}
      toneClassName={presentation.toneClassName}
      title={presentation.title}
    />
  )
}

type BookingResultActionProps = {
  action: ReturnType<typeof getBookingResultPresentation>['action']
  calendarErrorMessage?: string | null | undefined
  onAddToCalendar?: (() => Promise<void>) | undefined
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  traceId: string
}

function BookingResultAction({
  action,
  calendarErrorMessage,
  onAddToCalendar,
  onExportTrace,
  traceId,
}: BookingResultActionProps) {
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(
    calendarErrorMessage ?? null,
  )

  useEffect(() => {
    setInlineErrorMessage(calendarErrorMessage ?? null)
  }, [calendarErrorMessage])

  if (onAddToCalendar !== undefined) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => {
            setInlineErrorMessage(null)

            void onAddToCalendar().catch(() => {
              setInlineErrorMessage(
                'Could not add this booking to your calendar.',
              )
            })
          }}
        >
          Add to calendar
        </Button>

        {inlineErrorMessage ? (
          <p className="text-sm text-amber-200">{inlineErrorMessage}</p>
        ) : null}
      </div>
    )
  }

  switch (action.kind) {
    case 'payment':
      return (
        <Button asChild className="w-full sm:w-auto">
          <a href={action.href} rel="noopener noreferrer" target="_blank">
            Continue to payment
          </a>
        </Button>
      )
    case 'copy-diagnostics':
      if (onExportTrace === undefined) {
        return null
      }

      return (
        <DiagnosticsCopyAction
          buttonContent={
            <>
              <Copy className="size-4" />
              Copy diagnostics
            </>
          }
          onCopy={() => onExportTrace(traceId)}
        />
      )
    case 'none':
      return null
  }
}

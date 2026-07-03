import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BookingFlowResult } from '../../../domain/booking'
import { DiagnosticsCopyAction } from '../../diagnostics/DiagnosticsCopyAction'
import { getBookingResultPresentation } from '../booking-result-presentation'
import { BookingStatePanel } from './BookingStatePanel'

type BookingResultPanelProps = {
  onAddToCalendar?: (() => Promise<void>) | undefined
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  result: BookingFlowResult
  selectionLabel: string
  showAddToCalendar?: boolean | undefined
  traceId: string
}

export function BookingResultPanel({
  onAddToCalendar,
  onExportTrace,
  result,
  selectionLabel,
  showAddToCalendar,
  traceId,
}: BookingResultPanelProps) {
  const presentation = getBookingResultPresentation(result, selectionLabel)

  return (
    <BookingStatePanel
      body={presentation.body}
      actions={
        <BookingResultAction
          key={traceId}
          action={presentation.action}
          onAddToCalendar={
            result.status === 'success' && showAddToCalendar
              ? onAddToCalendar
              : undefined
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
  onAddToCalendar?: (() => Promise<void>) | undefined
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  traceId: string
}

function BookingResultAction({
  action,
  onAddToCalendar,
  onExportTrace,
  traceId,
}: BookingResultActionProps) {
  if (onAddToCalendar !== undefined) {
    return (
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={() => {
          void onAddToCalendar()
        }}
      >
        Add to calendar
      </Button>
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

import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BookingFlowResult } from '../../../domain/booking'
import { DiagnosticsCopyAction } from '../../diagnostics/DiagnosticsCopyAction'
import { getBookingResultPresentation } from '../booking-result-presentation'
import { BookingStatePanel } from './BookingStatePanel'

type BookingResultPanelProps = {
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  result: BookingFlowResult
  selectionLabel: string
  traceId: string
}

export function BookingResultPanel({
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
          key={traceId}
          action={presentation.action}
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
  onExportTrace?: ((traceId: string) => Promise<void>) | undefined
  traceId: string
}

function BookingResultAction({
  action,
  onExportTrace,
  traceId,
}: BookingResultActionProps) {
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

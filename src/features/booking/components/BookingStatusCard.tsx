import {
  CircleAlert,
  CircleCheckBig,
  CreditCard,
  LoaderCircle,
  type LucideIcon,
  X,
} from 'lucide-react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  eyebrowClassName,
  statusToneClassNames,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'
import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../../domain/booking'
import { getCableById } from '../../../domain/cable'

type BookingStatusCardProps =
  | {
      onDismiss?: never
      selection: BookingSlotSelection
      status: 'submitting'
      traceId: string
    }
  | {
      onDismiss?: (() => void) | undefined
      result: BookingFlowResult
      selection: BookingSlotSelection
      status: 'completed'
      traceId: string
    }

export function BookingStatusCard(props: BookingStatusCardProps) {
  const selectionLabel = formatSelectionLabel(props.selection)

  if (props.status === 'submitting') {
    return (
      <BookingStatusPanel
        body={`Submitting ${selectionLabel} through the storefront flow.`}
        icon={LoaderCircle}
        iconClassName="animate-spin text-muted-foreground"
        labelClassName="text-muted-foreground"
        role="status"
        title="Booking in progress"
        traceId={props.traceId}
        toneClassName={subtleSurfaceBackgroundClassName}
      />
    )
  }

  const presentation = getResultPresentation(props.result, selectionLabel)
  return (
    <BookingStatusPanel
      action={
        props.result.status === 'payment_required' &&
        props.result.redirectUrl !== null ? (
          <Button asChild className="w-full sm:w-auto">
            <a href={props.result.redirectUrl}>Continue to payment</a>
          </Button>
        ) : null
      }
      body={presentation.body}
      icon={presentation.icon}
      iconClassName={presentation.tone.accent}
      onDismiss={props.onDismiss}
      role={presentation.role}
      title={presentation.title}
      traceId={props.traceId}
      toneClassName={presentation.tone.surface}
    />
  )
}

type BookingStatusPanelProps = {
  action?: React.ReactNode
  body: string
  icon: LucideIcon
  iconClassName?: string
  label?: React.ReactNode
  labelClassName?: string
  onDismiss?: (() => void) | undefined
  role: 'alert' | 'status'
  title: string
  traceId: string
  toneClassName: string
}

function BookingStatusPanel({
  action,
  body,
  icon: Icon,
  iconClassName,
  label = 'Booking',
  labelClassName,
  onDismiss,
  role,
  title,
  traceId,
  toneClassName,
}: BookingStatusPanelProps) {
  return (
    <section aria-live="polite" role={role}>
      <Card className={toneClassName}>
        <CardHeader className="gap-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Icon className={cn('mt-0.5 size-4', iconClassName)} />
              <div className="space-y-1">
                <p className={cn(eyebrowClassName, labelClassName)}>{label}</p>
                <h3 className="text-base font-semibold">{title}</h3>
              </div>
            </div>
            {onDismiss ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="-mr-2 -mt-2 size-8 shrink-0 rounded-full"
                aria-label="Dismiss booking status"
                onClick={onDismiss}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{body}</p>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {action}
          <p className="text-xs text-muted-foreground">
            Trace ID:{' '}
            <span className="font-mono text-foreground">{traceId}</span>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

function getResultPresentation(
  result: BookingFlowResult,
  selectionLabel: string,
): {
  body: string
  icon: typeof CircleAlert
  role: 'alert' | 'status'
  tone: (typeof statusToneClassNames)[keyof typeof statusToneClassNames]
  title: string
} {
  switch (result.status) {
    case 'success':
      return {
        body: `${selectionLabel} was booked without any remaining payment.`,
        icon: CircleCheckBig,
        role: 'status',
        tone: statusToneClassNames.success,
        title: 'Booking confirmed',
      }
    case 'payment_required':
      return {
        body:
          result.redirectUrl !== null
            ? `${selectionLabel} was added successfully. Continue to payment to finish checkout.`
            : `${selectionLabel} was added successfully. Finish checkout in the storefront payment flow.`,
        icon: CreditCard,
        role: 'status',
        tone: statusToneClassNames.warning,
        title: 'Payment required',
      }
    case 'failed':
      return {
        body: getFailureMessage(result, selectionLabel),
        icon: CircleAlert,
        role: 'alert',
        tone: statusToneClassNames.destructive,
        title: 'Booking failed',
      }
  }
}

function getFailureMessage(
  result: Extract<BookingFlowResult, { status: 'failed' }>,
  selectionLabel: string,
): string {
  switch (result.step) {
    case 'profile':
      return 'Complete your name, phone, and email in Settings before trying to book.'
    case 'code':
      return result.message.length > 0
        ? `The saved season pass code was not accepted. ${result.message}`
        : 'The saved season pass code was not accepted. Update it in Settings and try again.'
    case 'checkout':
      return `${selectionLabel} could not be completed during checkout. ${result.message}`
    case 'unexpected':
      return result.message
  }
}

function formatSelectionLabel(selection: BookingSlotSelection): string {
  const cable = getCableById(selection.cableId)
  const displayDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(`${selection.date}T00:00:00`))

  return `${cable.label} on ${displayDate} at ${selection.startTime}-${selection.endTime}`
}

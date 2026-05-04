import {
  CircleAlert,
  CircleCheckBig,
  CreditCard,
  LoaderCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  BookingFlowResult,
  BookingSlotSelection,
} from '../../../domain/booking'
import { getCableById } from '../../../domain/cable'

type BookingStatusCardProps =
  | {
      selection: BookingSlotSelection
      status: 'submitting'
      traceId: string
    }
  | {
      result: BookingFlowResult
      selection: BookingSlotSelection
      status: 'completed'
      traceId: string
    }

export function BookingStatusCard(props: BookingStatusCardProps) {
  const selectionLabel = formatSelectionLabel(props.selection)

  if (props.status === 'submitting') {
    const Icon = LoaderCircle

    return (
      <section aria-live="polite" role="status">
        <Card className="border-border/70 bg-muted/20 shadow-none">
          <CardHeader className="gap-3 pb-4">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 animate-spin text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Booking
                </p>
                <h3 className="text-base font-semibold">Booking in progress</h3>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Submitting {selectionLabel} through the storefront flow.
            </p>
          </CardHeader>

          <CardContent>
            <p className="text-xs text-muted-foreground">
              Trace ID:{' '}
              <span className="font-mono text-foreground">{props.traceId}</span>
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  const presentation = getResultPresentation(props.result, selectionLabel)

  return (
    <section aria-live="polite" role={presentation.role}>
      <Card className={cn('shadow-none', presentation.cardClassName)}>
        <CardHeader className="gap-3 pb-4">
          <div className="flex items-start gap-3">
            <presentation.icon
              className={cn('mt-0.5 size-4', presentation.accentClassName)}
            />
            <div className="space-y-1">
              <p
                className={cn(
                  'text-xs uppercase tracking-[0.2em]',
                  presentation.accentClassName,
                )}
              >
                Booking
              </p>
              <h3 className="text-base font-semibold">{presentation.title}</h3>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {presentation.body}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {props.result.status === 'payment_required' &&
          props.result.redirectUrl !== null ? (
            <Button asChild className="w-full sm:w-auto">
              <a href={props.result.redirectUrl}>Continue to payment</a>
            </Button>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Trace ID:{' '}
            <span className="font-mono text-foreground">{props.traceId}</span>
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
  accentClassName: string
  body: string
  cardClassName: string
  icon: typeof CircleAlert
  role: 'alert' | 'status'
  title: string
} {
  switch (result.status) {
    case 'success':
      return {
        accentClassName: 'text-emerald-300',
        body: `${selectionLabel} was booked without any remaining payment.`,
        cardClassName: 'border-emerald-500/20 bg-card',
        icon: CircleCheckBig,
        role: 'status',
        title: 'Booking confirmed',
      }
    case 'payment_required':
      return {
        accentClassName: 'text-amber-300',
        body: `${selectionLabel} was added successfully. Continue to payment to finish checkout.`,
        cardClassName: 'border-amber-500/20 bg-card',
        icon: CreditCard,
        role: 'status',
        title: 'Payment required',
      }
    case 'failed':
      return {
        accentClassName: 'text-rose-300',
        body: getFailureMessage(result, selectionLabel),
        cardClassName: 'border-rose-500/20 bg-card',
        icon: CircleAlert,
        role: 'alert',
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

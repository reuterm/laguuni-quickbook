import '../booking.css'

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
    return (
      <section
        className="booking-state booking-state--progress"
        aria-live="polite"
        role="status"
      >
        <p className="screen-kicker">Booking status</p>
        <h3 className="booking-state__title">Booking in progress</h3>
        <p className="screen-copy">
          Submitting {selectionLabel} through the storefront flow.
        </p>
        <p className="booking-state__trace">
          Trace ID: <strong>{props.traceId}</strong>
        </p>
      </section>
    )
  }

  const presentation = getResultPresentation(props.result, selectionLabel)

  return (
    <section
      className={`booking-state booking-state--${presentation.variant}`}
      aria-live="polite"
      role={presentation.role}
    >
      <p className="screen-kicker">Booking status</p>
      <h3 className="booking-state__title">{presentation.title}</h3>
      <p className="screen-copy">{presentation.body}</p>

      {props.result.status === 'payment_required' &&
      props.result.redirectUrl !== null ? (
        <a
          className="primary-action booking-state__link"
          href={props.result.redirectUrl}
        >
          Continue to payment
        </a>
      ) : null}

      <p className="booking-state__trace">
        Trace ID: <strong>{props.traceId}</strong>
      </p>
    </section>
  )
}

function getResultPresentation(
  result: BookingFlowResult,
  selectionLabel: string,
): {
  body: string
  role: 'alert' | 'status'
  title: string
  variant: 'failure' | 'payment' | 'success'
} {
  switch (result.status) {
    case 'success':
      return {
        body: `${selectionLabel} was booked without any remaining payment.`,
        role: 'status',
        title: 'Booking confirmed',
        variant: 'success',
      }
    case 'payment_required':
      return {
        body: `${selectionLabel} was added successfully. Continue to payment to finish checkout.`,
        role: 'status',
        title: 'Payment required',
        variant: 'payment',
      }
    case 'failed':
      return {
        body: getFailureMessage(result, selectionLabel),
        role: 'alert',
        title: 'Booking failed',
        variant: 'failure',
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

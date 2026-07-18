import {
  CircleAlert,
  CircleCheckBig,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'

import { statusToneClassNames } from '@/components/ui/styles'
import type { BookingFlowResult } from '../../domain/booking'

export type BookingResultPresentation = {
  action:
    | {
        kind: 'copy-diagnostics'
      }
    | {
        href: string
        kind: 'payment'
      }
    | {
        kind: 'none'
      }
    | {
        kind: 'add-to-calendar'
      }
  body: string
  icon: LucideIcon
  iconClassName: string
  role: 'alert' | 'status'
  toneClassName: string
  title: string
}

export function getBookingResultPresentation(
  result: BookingFlowResult,
  selectionLabel: string,
): BookingResultPresentation {
  switch (result.status) {
    case 'success':
      return {
        action: { kind: 'add-to-calendar' },
        body: `${selectionLabel} was booked without any remaining payment.`,
        icon: CircleCheckBig,
        iconClassName: statusToneClassNames.success.accent,
        role: 'status',
        toneClassName: statusToneClassNames.success.surface,
        title: 'Booking confirmed',
      }
    case 'payment_required':
      return {
        action:
          result.redirectUrl !== null
            ? {
                href: result.redirectUrl,
                kind: 'payment',
              }
            : { kind: 'none' },
        body:
          result.redirectUrl !== null
            ? 'Continue to payment to finish checkout.'
            : 'Finish checkout in the storefront payment flow.',
        icon: CreditCard,
        iconClassName: statusToneClassNames.warning.accent,
        role: 'status',
        toneClassName: statusToneClassNames.warning.surface,
        title: 'Payment required',
      }
    case 'failed':
      return {
        action: { kind: 'copy-diagnostics' },
        body: getBookingFailureMessage(result, selectionLabel),
        icon: CircleAlert,
        iconClassName: statusToneClassNames.destructive.accent,
        role: 'alert',
        toneClassName: statusToneClassNames.destructive.surface,
        title: 'Booking failed',
      }
  }
}

function getBookingFailureMessage(
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

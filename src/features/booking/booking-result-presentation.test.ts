import { describe, expect, it } from 'vitest'

import { getBookingResultPresentation } from './booking-result-presentation'

const selectionLabel = 'Pro on Wed, 20 May at 15:00-16:00'

describe('booking-result-presentation', () => {
  it('builds success presentation copy', () => {
    expect(
      getBookingResultPresentation(
        {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { kind: 'add-to-calendar' },
      body: `${selectionLabel} was booked without any remaining payment.`,
      role: 'status',
      title: 'Booking confirmed',
    })
  })

  it('builds payment-required presentation copy with a redirect', () => {
    expect(
      getBookingResultPresentation(
        {
          orderIdentifier: 'fixture-order-id',
          paymentToken: 'fixture-payment-token',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { href: 'https://example.com/pay', kind: 'payment' },
      body: 'Continue to payment to finish checkout.',
      role: 'status',
      title: 'Payment required',
    })
  })

  it('builds payment-required presentation copy without a redirect', () => {
    expect(
      getBookingResultPresentation(
        {
          orderIdentifier: 'fixture-order-id',
          paymentToken: null,
          redirectUrl: null,
          status: 'payment_required',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { kind: 'none' },
      body: 'Finish checkout in the storefront payment flow.',
      role: 'status',
      title: 'Payment required',
    })
  })

  it('builds profile validation failure copy', () => {
    expect(
      getBookingResultPresentation(
        {
          errorCode: 'PROFILE_INVALID',
          message: '',
          status: 'failed',
          step: 'profile',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { kind: 'copy-diagnostics' },
      body: 'Complete your name, phone, and email in Settings before trying to book.',
      role: 'alert',
      title: 'Booking failed',
    })
  })

  it('builds season pass failure copy with fallback text', () => {
    expect(
      getBookingResultPresentation(
        {
          errorCode: 'DISCOUNT_CODE_INVALID',
          message: '',
          status: 'failed',
          step: 'code',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { kind: 'copy-diagnostics' },
      body: 'The saved season pass code was not accepted. Update it in Settings and try again.',
      role: 'alert',
      title: 'Booking failed',
    })
  })

  it('builds checkout failure copy with selection context', () => {
    expect(
      getBookingResultPresentation(
        {
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { kind: 'copy-diagnostics' },
      body: `${selectionLabel} could not be completed during checkout. Fixture checkout failed.`,
      role: 'alert',
      title: 'Booking failed',
    })
  })

  it('builds unexpected failure copy directly from the error message', () => {
    expect(
      getBookingResultPresentation(
        {
          errorCode: 'GENERAL_ERROR',
          message: 'Unexpected storefront failure.',
          status: 'failed',
          step: 'unexpected',
        },
        selectionLabel,
      ),
    ).toMatchObject({
      action: { kind: 'copy-diagnostics' },
      body: 'Unexpected storefront failure.',
      role: 'alert',
      title: 'Booking failed',
    })
  })
})

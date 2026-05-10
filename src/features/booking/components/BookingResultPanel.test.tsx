import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BookingResultPanel } from './BookingResultPanel'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BookingResultPanel', () => {
  it('shows a copy diagnostics action for failed bookings', async () => {
    const user = userEvent.setup()
    const traceExport = vi.fn(async () => {})

    render(
      <BookingResultPanel
        onExportTrace={traceExport}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="test-trace-id"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy diagnostics' }))

    expect(traceExport).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Diagnostics copied to the clipboard.'),
    ).toBeVisible()
  })

  it('resets copy state when a new trace is rendered', async () => {
    const user = userEvent.setup()
    const traceExport = vi.fn(async () => {})
    const { rerender } = render(
      <BookingResultPanel
        onExportTrace={traceExport}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="trace-a"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy diagnostics' }))

    expect(
      screen.getByText('Diagnostics copied to the clipboard.'),
    ).toBeVisible()

    rerender(
      <BookingResultPanel
        onExportTrace={traceExport}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed again.',
          status: 'failed',
          step: 'checkout',
        }}
        selectionLabel="Pro on Thu 21 May at 16:00-17:00"
        traceId="trace-b"
      />,
    )

    expect(
      screen.queryByText('Diagnostics copied to the clipboard.'),
    ).not.toBeInTheDocument()
  })

  it('does not show copy diagnostics without an export callback', () => {
    render(
      <BookingResultPanel
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="test-trace-id"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Copy diagnostics' }),
    ).not.toBeInTheDocument()
  })

  it('shows the payment continuation action when payment is required', () => {
    render(
      <BookingResultPanel
        result={{
          orderIdentifier: 'fixture-order-id',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="test-trace-id"
      />,
    )

    expect(
      screen.getByRole('link', { name: 'Continue to payment' }),
    ).toBeInTheDocument()

    const paymentLink = screen.getByRole('link', {
      name: 'Continue to payment',
    })

    expect(paymentLink).toHaveAttribute('href', 'https://example.com/pay')
    expect(paymentLink).toHaveAttribute('target', '_blank')
    expect(paymentLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

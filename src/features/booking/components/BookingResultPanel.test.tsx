import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BookingResultPanel } from './BookingResultPanel'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BookingResultPanel', () => {
  it('shows an add to calendar action for successful bookings and calls it on click', async () => {
    const user = userEvent.setup()
    const addToCalendar = vi.fn(async () => {})

    render(
      <BookingResultPanel
        onAddToCalendar={addToCalendar}
        result={{
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="trace-success"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(addToCalendar).toHaveBeenCalledOnce()
  })

  it('shows an inline calendar export error when the action fails', async () => {
    const user = userEvent.setup()
    const addToCalendar = vi.fn(async () => {
      throw new Error('share failed')
    })

    render(
      <BookingResultPanel
        onAddToCalendar={addToCalendar}
        result={{
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="trace-success"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(addToCalendar).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Could not add this booking to your calendar.'),
    ).toBeVisible()
  })

  it('does not show an add to calendar action for non-success results', () => {
    const addToCalendar = vi.fn(async () => {})

    const { rerender } = render(
      <BookingResultPanel
        onAddToCalendar={addToCalendar}
        result={{
          orderIdentifier: 'fixture-order-id',
          paymentToken: 'fixture-payment-token',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="trace-payment"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Add to calendar' }),
    ).not.toBeInTheDocument()

    rerender(
      <BookingResultPanel
        onAddToCalendar={addToCalendar}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="trace-failed"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Add to calendar' }),
    ).not.toBeInTheDocument()
  })

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
          paymentToken: 'fixture-payment-token',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="test-trace-id"
      />,
    )

    expect(
      screen.getByRole('link', { name: 'Continue to payment' }),
    ).toHaveAttribute('href', 'https://example.com/pay')

    const paymentLink = screen.getByRole('link', {
      name: 'Continue to payment',
    })

    expect(paymentLink).toHaveAttribute('target', '_blank')
    expect(paymentLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
        onExportTrace={async () => {}}
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

  it('prevents duplicate calendar exports while an export is pending', async () => {
    const user = userEvent.setup()
    let resolveCalendarExport!: () => void
    const addToCalendar = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCalendarExport = resolve
        }),
    )

    render(
      <BookingResultPanel
        onAddToCalendar={addToCalendar}
        onExportTrace={async () => {}}
        result={{
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        }}
        selectionLabel="Pro on Wed 20 May at 15:00-16:00"
        traceId="trace-success"
      />,
    )

    const button = screen.getByRole('button', { name: 'Add to calendar' })
    await user.click(button)
    await user.click(button)

    expect(addToCalendar).toHaveBeenCalledOnce()
    expect(button).toBeDisabled()

    resolveCalendarExport()

    await waitFor(() => {
      expect(button).toBeEnabled()
    })
  })

  it('shows an inline calendar export error when the action fails', async () => {
    const user = userEvent.setup()
    const addToCalendar = vi.fn(async () => {
      throw new Error('share failed')
    })

    render(
      <BookingResultPanel
        onAddToCalendar={addToCalendar}
        onExportTrace={async () => {}}
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

  it('shows a copy diagnostics action for failed bookings', async () => {
    const user = userEvent.setup()
    const traceExport = vi.fn(async () => {})

    render(
      <BookingResultPanel
        onAddToCalendar={async () => {}}
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
        onAddToCalendar={async () => {}}
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
        onAddToCalendar={async () => {}}
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

  it('shows the payment continuation action when payment is required', () => {
    render(
      <BookingResultPanel
        onAddToCalendar={async () => {}}
        onExportTrace={async () => {}}
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
    expect(paymentLink).toHaveClass('w-full')
    expect(paymentLink).not.toHaveClass('sm:w-auto')
  })
})

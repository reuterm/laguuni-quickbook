import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BookingStatusCard,
  exportBookingDiagnosticsForTrace,
} from './BookingStatusCard'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BookingStatusCard', () => {
  it('does not apply spinner styling to the booking label while submitting', () => {
    render(
      <BookingStatusCard
        selection={{
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        }}
        status="submitting"
        traceId="test-trace-id"
      />,
    )

    expect(screen.getByText('Booking')).not.toHaveClass('animate-spin')
  })

  it('shows a copy diagnostics action for failed bookings', async () => {
    const user = userEvent.setup()
    const traceExport = vi.fn(async () => {})

    render(
      <BookingStatusCard
        onDismiss={() => {}}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selection={{
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        }}
        status="completed"
        traceExport={traceExport}
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
      <BookingStatusCard
        onDismiss={() => {}}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selection={{
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        }}
        status="completed"
        traceExport={traceExport}
        traceId="trace-a"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy diagnostics' }))

    expect(
      screen.getByText('Diagnostics copied to the clipboard.'),
    ).toBeVisible()

    rerender(
      <BookingStatusCard
        onDismiss={() => {}}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed again.',
          status: 'failed',
          step: 'checkout',
        }}
        selection={{
          cableId: 'pro',
          date: '2026-05-21',
          endTime: '17:00',
          startTime: '16:00',
        }}
        status="completed"
        traceExport={traceExport}
        traceId="trace-b"
      />,
    )

    expect(
      screen.queryByText('Diagnostics copied to the clipboard.'),
    ).not.toBeInTheDocument()
  })

  it('does not show copy diagnostics without an export callback', () => {
    render(
      <BookingStatusCard
        onDismiss={() => {}}
        result={{
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        }}
        selection={{
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        }}
        status="completed"
        traceId="test-trace-id"
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Copy diagnostics' }),
    ).not.toBeInTheDocument()
  })

  it('copies only the requested trace diagnostics', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    })

    await exportBookingDiagnosticsForTrace(
      ({ traceId }) => JSON.stringify({ traceId }),
      'test-trace-id',
    )

    expect(writeText).toHaveBeenCalledWith(
      JSON.stringify({ traceId: 'test-trace-id' }),
    )

    vi.unstubAllGlobals()
  })
})

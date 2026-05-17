import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { BookingSheetFlow } from './BookingSheetFlow'

afterEach(() => {
  cleanup()
})

describe('BookingSheetFlow', () => {
  it('does not render anything while the flow is closed', () => {
    render(
      <BookingSheetFlow
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    expect(
      screen.queryByRole('heading', { name: 'Booking details' }),
    ).not.toBeInTheDocument()
  })

  it('renders the confirmation panel for the confirm state', () => {
    render(
      <BookingSheetFlow
        bookingSheetState={{
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'confirm',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Confirm booking' }),
    ).toBeEnabled()
  })

  it('renders a non-dismissible submitting panel while booking is in progress', () => {
    render(
      <BookingSheetFlow
        bookingSheetState={{
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'submitting',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Booking in progress' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument()
  })

  it('renders the completed result panel and wires trace export', async () => {
    const onExportTrace = vi.fn(async () => {})

    render(
      <BookingSheetFlow
        bookingSheetState={{
          result: {
            errorCode: 'GENERAL_ERROR',
            message: 'Fixture checkout failed.',
            status: 'failed',
            step: 'checkout',
          },
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'completed',
          traceId: 'trace-failed',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={onExportTrace}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Booking failed' }),
    ).toBeInTheDocument()

    await screen.getByRole('button', { name: 'Copy diagnostics' }).click()

    expect(onExportTrace).toHaveBeenCalledWith('trace-failed')
  })
})

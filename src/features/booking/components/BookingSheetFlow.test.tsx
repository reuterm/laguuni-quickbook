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

  it('keeps the last sheet content mounted briefly after the flow closes', () => {
    vi.useFakeTimers()

    const confirmState = {
      selection: {
        cableId: 'pro',
        date: localDate('2026-05-20'),
        endTime: '16:00',
        startTime: '15:00',
      },
      status: 'confirm',
    } as const

    const { rerender } = render(
      <BookingSheetFlow
        bookingSheetState={confirmState}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()

    vi.runAllTimers()

    expect(
      screen.queryByRole('heading', { name: 'Booking details' }),
    ).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders the preserved sheet as closed before unmounting', () => {
    vi.useFakeTimers()

    const confirmState = {
      selection: {
        cableId: 'pro',
        date: localDate('2026-05-20'),
        endTime: '16:00',
        startTime: '15:00',
      },
      status: 'confirm',
    } as const

    const { container, rerender } = render(
      <BookingSheetFlow
        bookingSheetState={confirmState}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    expect(container.querySelector('[data-state="closed"]')).not.toBeNull()

    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('cancels a pending unmount when the booking sheet reopens', () => {
    vi.useFakeTimers()

    const firstState = {
      selection: {
        cableId: 'pro',
        date: localDate('2026-05-20'),
        endTime: '16:00',
        startTime: '15:00',
      },
      status: 'confirm',
    } as const

    const reopenedState = {
      selection: {
        cableId: 'easy',
        date: localDate('2026-05-21'),
        endTime: '11:00',
        startTime: '10:00',
      },
      status: 'confirm',
    } as const

    const { rerender } = render(
      <BookingSheetFlow
        bookingSheetState={firstState}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        bookingSheetState={reopenedState}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
      />,
    )

    vi.runAllTimers()

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Easy')).toBeInTheDocument()

    vi.useRealTimers()
  })
})

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localDate } from '../../../../tests/local-date'
import * as bookingCalendarAction from '../../calendar/use-booking-calendar-action'
import { BookingSheetFlow } from './BookingSheetFlow'

const shareOrDownloadCalendarFileMock = vi.fn<
  (
    _file: File,
    _options: { text: string; title: string },
  ) => Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>
>(async () => 'downloaded')

vi.mock('../../calendar/calendar-share', () => ({
  shareOrDownloadCalendarFile: (
    file: File,
    options: { text: string; title: string },
  ) => shareOrDownloadCalendarFileMock(file, options),
}))

afterEach(() => {
  cleanup()
  shareOrDownloadCalendarFileMock.mockReset()
})

describe('BookingSheetFlow', () => {
  it('does not render anything while the flow is closed', () => {
    render(
      <BookingSheetFlow
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
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
        onExportTrace={async () => {}}
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
        onExportTrace={async () => {}}
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

  it('constructs the calendar action for failed completed bookings without rendering its button', () => {
    const useBookingCalendarActionSpy = vi.spyOn(
      bookingCalendarAction,
      'useBookingCalendarAction',
    )
    const selection = {
      cableId: 'pro',
      date: localDate('2026-05-20'),
      endTime: '16:00',
      startTime: '15:00',
    } as const

    render(
      <BookingSheetFlow
        bookingSheetState={{
          result: {
            errorCode: 'GENERAL_ERROR',
            message: 'Fixture checkout failed.',
            status: 'failed',
            step: 'checkout',
          },
          selection,
          status: 'completed',
          traceId: 'trace-failed-calendar-uid',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    expect(useBookingCalendarActionSpy).toHaveBeenCalledWith(
      selection,
      'trace-failed-calendar-uid',
    )
    expect(
      screen.queryByRole('button', { name: 'Add to calendar' }),
    ).not.toBeInTheDocument()
  })

  it('wires add to calendar for completed successful bookings', async () => {
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        bookingSheetState={{
          result: {
            orderIdentifier: 'fixture-order-id',
            status: 'success',
          },
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'completed',
          traceId: 'trace-success',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(shareOrDownloadCalendarFileMock).toHaveBeenCalledOnce()
  })

  it('uses the trace ID as the calendar UID when success has no order identifier', async () => {
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        bookingSheetState={{
          result: { orderIdentifier: null, status: 'success' },
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'completed',
          traceId: 'trace-uid-fallback',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    const [file] = shareOrDownloadCalendarFileMock.mock.calls[0] ?? []
    expect(file).toBeInstanceOf(File)
    if (!file) {
      throw new Error('Expected a calendar file to be shared.')
    }
    expect(await file.text()).toContain(
      'UID:laguuni-booking-trace-uid-fallback',
    )
  })

  it('keeps calendar export cancellation neutral in the completed success flow', async () => {
    const user = userEvent.setup()

    shareOrDownloadCalendarFileMock.mockResolvedValueOnce('cancelled')

    render(
      <BookingSheetFlow
        bookingSheetState={{
          result: {
            orderIdentifier: 'fixture-order-id',
            status: 'success',
          },
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'completed',
          traceId: 'trace-success-cancelled',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(shareOrDownloadCalendarFileMock).toHaveBeenCalledOnce()
    expect(
      screen.queryByText('Could not add this booking to your calendar.'),
    ).not.toBeInTheDocument()
  })

  it('shows an inline error when calendar export fully fails in the completed success flow', async () => {
    const user = userEvent.setup()

    shareOrDownloadCalendarFileMock.mockResolvedValueOnce('failed')

    render(
      <BookingSheetFlow
        bookingSheetState={{
          result: {
            orderIdentifier: 'fixture-order-id',
            status: 'success',
          },
          selection: {
            cableId: 'pro',
            date: localDate('2026-05-20'),
            endTime: '16:00',
            startTime: '15:00',
          },
          status: 'completed',
          traceId: 'trace-success-failed',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(shareOrDownloadCalendarFileMock).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Could not add this booking to your calendar.'),
    ).toBeVisible()
  })

  it('cancels a pending unmount when the booking sheet reopens', () => {
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
        onExportTrace={async () => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        bookingSheetState={reopenedState}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Easy')).toBeInTheDocument()
  })
})

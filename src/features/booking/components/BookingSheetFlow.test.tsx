import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localDate } from '../../../../tests/local-date'
import { BookingSheetFlow } from './BookingSheetFlow'

const bookingConfirmPanelMock = vi.hoisted(() => vi.fn())

vi.mock('./BookingConfirmPanel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./BookingConfirmPanel')>()

  return {
    ...actual,
    BookingConfirmPanel: (
      props: Parameters<typeof actual.BookingConfirmPanel>[0],
    ) => {
      bookingConfirmPanelMock(props)
      return <actual.BookingConfirmPanel {...props} />
    },
  }
})

const downloadCalendarFileMock = vi.fn<
  (_file: File) => Promise<'downloaded' | 'failed'>
>(async () => 'downloaded')

vi.mock('../../calendar/calendar-download', () => ({
  downloadCalendarFile: (file: File) => downloadCalendarFileMock(file),
}))

afterEach(() => {
  cleanup()
  bookingConfirmPanelMock.mockReset()
  downloadCalendarFileMock.mockReset()
})

describe('BookingSheetFlow', () => {
  const noContinuationActions = {
    basket: { onClearSelection: () => {} },
    initial: { continuation: 'none' as const },
  }

  it('does not render anything while the flow is closed', () => {
    render(
      <BookingSheetFlow
        actions={noContinuationActions}
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

  it('does not show a secondary action for initial confirmations without continuation', () => {
    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          kind: 'initial',
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
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
    expect(
      screen.queryByRole('button', { name: 'Add more' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear selection' }),
    ).not.toBeInTheDocument()
    expect(bookingConfirmPanelMock).toHaveBeenCalledOnce()
    expect(bookingConfirmPanelMock.mock.calls[0]?.[0]).not.toHaveProperty(
      'secondaryAction',
    )
  })

  it('adds more from an initial continuation confirmation', async () => {
    const onAddMore = vi.fn()
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        actions={{
          basket: { onClearSelection: () => {} },
          initial: { continuation: 'add-more', onAddMore },
        }}
        bookingSheetState={{
          kind: 'initial',
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
          status: 'confirm',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add more' }))

    expect(onAddMore).toHaveBeenCalledOnce()
  })

  it('clears and dismisses a basket confirmation', async () => {
    const onClearSelection = vi.fn()
    const dismissBookingSheet = vi.fn()
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        actions={{
          basket: { onClearSelection },
          initial: { continuation: 'none' },
        }}
        bookingSheetState={{
          kind: 'basket',
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
          status: 'confirm',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={dismissBookingSheet}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onClearSelection).toHaveBeenCalledOnce()
    expect(dismissBookingSheet).toHaveBeenCalledOnce()
    expect(onClearSelection).toHaveBeenCalledBefore(dismissBookingSheet)
    expect(
      screen.queryByRole('button', { name: 'Add more' }),
    ).not.toBeInTheDocument()
  })

  it('renders a non-dismissible submitting panel while booking is in progress', () => {
    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
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

  it('describes the number of slots while submitting', () => {
    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
            {
              cableId: 'easy',
              date: localDate('2026-05-21'),
              endTime: '11:00',
              startTime: '10:00',
            },
          ],
          status: 'submitting',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    expect(
      screen.getByText('Booking 2 slots through the storefront flow.'),
    ).toBeInTheDocument()
  })

  it('renders the completed result panel and wires trace export', async () => {
    const onExportTrace = vi.fn(async () => {})

    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          result: {
            errorCode: 'GENERAL_ERROR',
            message: 'Fixture checkout failed.',
            status: 'failed',
            step: 'checkout',
          },
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
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
    expect(
      screen.queryByRole('button', { name: 'Add to calendar' }),
    ).not.toBeInTheDocument()

    await screen.getByRole('button', { name: 'Copy diagnostics' }).click()

    expect(onExportTrace).toHaveBeenCalledWith('trace-failed')
  })

  it('wires add to calendar for completed successful bookings', async () => {
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          result: {
            orderIdentifier: 'fixture-order-id',
            status: 'success',
          },
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
          status: 'completed',
          traceId: 'trace-success',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(downloadCalendarFileMock).toHaveBeenCalledOnce()
  })

  it('exports every successful booking selection in one calendar file', async () => {
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          result: {
            orderIdentifier: 'fixture-mixed-cable-order-id',
            status: 'success',
          },
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
            {
              cableId: 'easy',
              date: localDate('2026-05-21'),
              endTime: '11:00',
              startTime: '10:00',
            },
          ],
          status: 'completed',
          traceId: 'trace-mixed-cable-success',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    expect(
      screen.getByText('2 slots was booked without any remaining payment.'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    const [file] = downloadCalendarFileMock.mock.calls[0] ?? []
    expect(file).toBeInstanceOf(File)
    if (!file) {
      throw new Error('Expected a calendar file to be downloaded.')
    }
    const calendarText = await file.text()
    expect(calendarText).toContain('SUMMARY:Wakeboarding - Pro')
    expect(calendarText).toContain('SUMMARY:Wakeboarding - Easy')
  })

  it('uses the trace ID as the calendar UID when success has no order identifier', async () => {
    const user = userEvent.setup()

    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          result: { orderIdentifier: null, status: 'success' },
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
          status: 'completed',
          traceId: 'trace-uid-fallback',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    const [file] = downloadCalendarFileMock.mock.calls[0] ?? []
    expect(file).toBeInstanceOf(File)
    if (!file) {
      throw new Error('Expected a calendar file to be downloaded.')
    }
    expect(await file.text()).toContain(
      'UID:laguuni-booking-trace-uid-fallback',
    )
  })

  it('shows an inline error when calendar export fully fails in the completed success flow', async () => {
    const user = userEvent.setup()

    downloadCalendarFileMock.mockResolvedValueOnce('failed')

    render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{
          result: {
            orderIdentifier: 'fixture-order-id',
            status: 'success',
          },
          selections: [
            {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
          ],
          status: 'completed',
          traceId: 'trace-success-failed',
        }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(downloadCalendarFileMock).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Could not add this booking to your calendar.'),
    ).toBeVisible()
  })

  it('cancels a pending unmount when the booking sheet reopens', () => {
    const firstState = {
      kind: 'initial',
      selections: [
        {
          cableId: 'pro',
          date: localDate('2026-05-20'),
          endTime: '16:00',
          startTime: '15:00',
        },
      ],
      status: 'confirm',
    } as const

    const reopenedState = {
      kind: 'initial',
      selections: [
        {
          cableId: 'easy',
          date: localDate('2026-05-21'),
          endTime: '11:00',
          startTime: '10:00',
        },
      ],
      status: 'confirm',
    } as const

    const { rerender } = render(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={firstState}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        actions={noContinuationActions}
        bookingSheetState={{ status: 'closed' }}
        confirmBooking={async () => {}}
        dismissBookingSheet={() => {}}
        onExportTrace={async () => {}}
      />,
    )

    rerender(
      <BookingSheetFlow
        actions={noContinuationActions}
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

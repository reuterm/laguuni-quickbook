import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../../../app/providers'
import { DEFAULT_USER_SETTINGS } from '../../../domain/settings'
import { UserSettingsProvider } from '../../settings/use-user-settings'
import type { BrowserStorage } from '../../../lib/storage/local-storage'
import { SETTINGS_STORAGE_KEY } from '../../../lib/storage/local-storage'
import { createMemoryStorage } from '../../../test/create-memory-storage'
import { localDate } from '../../../../tests/local-date'
import { BookingSheetFlow } from './BookingSheetFlow'

const shareOrDownloadCalendarFileMock = vi.fn(
  async (_file: File, _options: { text: string; title: string }) =>
    'downloaded' as const,
)

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

  it('wires add to calendar only for completed successful bookings', async () => {
    const user = userEvent.setup()
    const storage = createMemoryStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        ...DEFAULT_USER_SETTINGS,
        calendarExportEnabled: true,
        version: 1,
      }),
    })

    const { rerender } = render(
      <TestProviders storage={storage}>
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
        />
      </TestProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Add to calendar' }))

    expect(shareOrDownloadCalendarFileMock).toHaveBeenCalledOnce()

    rerender(
      <TestProviders storage={storage}>
        <BookingSheetFlow
          bookingSheetState={{
            result: {
              orderIdentifier: 'fixture-order-id',
              paymentToken: 'fixture-payment-token',
              redirectUrl: 'https://example.com/pay',
              status: 'payment_required',
            },
            selection: {
              cableId: 'pro',
              date: localDate('2026-05-20'),
              endTime: '16:00',
              startTime: '15:00',
            },
            status: 'completed',
            traceId: 'trace-payment',
          }}
          confirmBooking={async () => {}}
          dismissBookingSheet={() => {}}
        />
      </TestProviders>,
    )

    expect(
      screen.queryByRole('button', { name: 'Add to calendar' }),
    ).not.toBeInTheDocument()
  })

  it('keeps add to calendar hidden when the calendar export setting is disabled', () => {
    const storage = createMemoryStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        ...DEFAULT_USER_SETTINGS,
        calendarExportEnabled: false,
        version: 1,
      }),
    })

    render(
      <TestProviders storage={storage}>
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
            traceId: 'trace-success-disabled',
          }}
          confirmBooking={async () => {}}
          dismissBookingSheet={() => {}}
        />
      </TestProviders>,
    )

    expect(
      screen.queryByRole('button', { name: 'Add to calendar' }),
    ).not.toBeInTheDocument()
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

    expect(
      screen.getByRole('heading', { name: 'Confirm booking' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Easy')).toBeInTheDocument()
  })
})

function TestProviders({
  children,
  storage,
}: {
  children: React.ReactNode
  storage: BrowserStorage
}) {
  return (
    <AppProviders
      apiBaseUrl="https://shop.laguuniin.fi"
      appVersion="test-version"
      fetchImplementation={globalThis.fetch.bind(globalThis)}
      storage={storage}
    >
      <UserSettingsProvider>{children}</UserSettingsProvider>
    </AppProviders>
  )
}

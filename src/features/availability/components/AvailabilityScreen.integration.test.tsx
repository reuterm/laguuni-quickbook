import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { AvailabilityScreen } from './AvailabilityScreen'

const firstSelection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-20'),
  endTime: '16:00',
  startTime: '15:00',
}
const secondSelection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-21'),
  endTime: '17:00',
  startTime: '16:00',
}

const mocks = vi.hoisted(() => ({
  requestBooking: vi.fn(),
}))

vi.mock('../../../app/providers', () => ({
  useAvailabilityReferenceDate: () => new Date('2026-05-20T12:00:00'),
  useDiagnostics: () => ({ exportLogs: vi.fn() }),
  useLaguuniApi: vi.fn(),
  useReadOnlyNoticeStore: () => ({ dismiss: vi.fn(), isDismissed: () => true }),
}))

vi.mock('../../settings/use-user-settings', () => ({
  useUserSettings: () => ({ settings: { availabilityView: 'cards' } }),
}))

vi.mock('../../booking/use-booking-sheet-controller', () => ({
  useBookingSheetController: vi.fn(({ onBookingFinalized }) => {
    const [bookingSheetState, setBookingSheetState] = useState<
      | { status: 'closed' }
      | {
          kind: 'basket' | 'initial'
          selections: readonly (typeof firstSelection)[]
          status: 'confirm'
        }
      | {
          result: { status: 'success' }
          selections: readonly (typeof firstSelection)[]
          status: 'completed'
          traceId: string
        }
    >({ status: 'closed' })

    return {
      bookingSheetState,
      confirmBooking: async () => {
        if (bookingSheetState.status !== 'confirm') {
          return
        }

        const completedBooking = {
          result: { status: 'success' as const },
          selections: bookingSheetState.selections,
          status: 'completed' as const,
          traceId: 'booking-trace',
        }

        setBookingSheetState(completedBooking)
        await onBookingFinalized?.(completedBooking)
      },
      dismissBookingSheet: () => setBookingSheetState({ status: 'closed' }),
      isBookingInProgress: false,
      isBookingReady: true,
      keepBookingForMore: () => {
        if (bookingSheetState.status === 'confirm') {
          setBookingSheetState({ status: 'closed' })
        }
      },
      requestBooking: (
        kind: 'basket' | 'initial',
        selections: readonly (typeof firstSelection)[],
      ) => {
        mocks.requestBooking(kind, selections)
        setBookingSheetState({ kind, selections, status: 'confirm' })
      },
    }
  }),
}))

vi.mock('../use-availability-overview', () => ({
  useAvailabilityOverview: () => ({
    availabilityState: {
      appendErrorMessage: null,
      canLoadMore: false,
      dayGroups: [
        {
          date: localDate('2026-05-20'),
          displayDate: 'Wed 20 May',
          slots: [
            {
              endTime: '16:00',
              freeCapacity: 3,
              id: 'first',
              selection: firstSelection,
              startTime: '15:00',
              totalCapacity: 4,
            },
          ],
        },
        {
          date: localDate('2026-05-21'),
          displayDate: 'Thu 21 May',
          slots: [
            {
              endTime: '17:00',
              freeCapacity: 2,
              id: 'second',
              selection: secondSelection,
              startTime: '16:00',
              totalCapacity: 4,
            },
          ],
        },
      ],
      isLoadingMore: false,
      status: 'ready',
      weekPages: [],
    },
    loadMoreAvailability: async () => {},
    refreshAvailabilitySelection: async () => {},
  }),
}))

vi.mock('../use-availability-scope', () => ({
  useAvailabilityScope: () => ({ selectCable: vi.fn(), selectedCable: 'pro' }),
}))

describe('AvailabilityScreen basket flow', () => {
  afterEach(() => {
    cleanup()
    mocks.requestBooking.mockClear()
  })

  it('offers Add more when immediately booking a slot', async () => {
    const user = userEvent.setup()

    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    const firstBookButton = screen.getAllByRole('button', { name: 'Book' })[0]
    if (firstBookButton === undefined) {
      throw new Error('Expected a bookable slot')
    }

    await user.click(firstBookButton)
    expect(mocks.requestBooking).toHaveBeenCalledWith('initial', [firstSelection])

    expect(screen.getByRole('button', { name: 'Add more' })).toBeVisible()
  })
})

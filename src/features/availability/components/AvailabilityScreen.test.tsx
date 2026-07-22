import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BookingSlotSelection } from '@/domain/booking'
import type { BookingSheetFlowActions } from '../../booking/components/BookingSheetFlow'
import { localDate } from '../../../../tests/local-date'
import { AvailabilityScreen } from './AvailabilityScreen'

const mocks = vi.hoisted(() => ({
  availabilityOverviewContentProps: undefined as
    | {
        basket: {
          isSelected: (selection: { date: string }) => boolean
          kind: 'basket' | 'initial'
          onAddSelection: (selection: { date: string }) => void
          onRemoveSelection: (selection: { date: string }) => void
          onReview: () => void
        }
        bookingActionMode: string
        onBookSelection?: (selection: { date: string }) => void
      }
    | undefined,
  bookingSheetFlowProps: undefined as
    | {
        actions: BookingSheetFlowActions
      }
    | undefined,
  bookingSheetState: { status: 'closed' } as
    | { status: 'closed' }
    | {
        kind: 'basket'
        selections: readonly { date: string }[]
        status: 'confirm'
      }
    | {
        kind: 'initial'
        selections: readonly { date: string }[]
        status: 'confirm'
      },
  isBookingReady: false,
  onKeepBookingForMore: undefined as
    | ((selection: { date: string }) => void)
    | undefined,
  onBookingFinalized: undefined as
   | ((booking: {
        result: { status: 'success' }
        selections: readonly BookingSlotSelection[]
      }) => Promise<void>)
    | undefined,
  refreshAvailabilitySelection: vi.fn(async () => {}),
  requestInitialBooking: vi.fn(),
}))

vi.mock('../../../app/providers', () => ({
  useAvailabilityReferenceDate: vi.fn(),
  useDiagnostics: vi.fn(),
  useLaguuniApi: vi.fn(),
  useReadOnlyNoticeStore: vi.fn(() => ({ isDismissed: () => false })),
}))

vi.mock('../../booking/use-booking-sheet-controller', () => ({
  useBookingSheetController: vi.fn(
    ({ onBookingFinalized, onKeepBookingForMore }) => {
      mocks.onBookingFinalized = onBookingFinalized
      mocks.onKeepBookingForMore = onKeepBookingForMore

      return {
        bookingSheetState: mocks.bookingSheetState,
        confirmBooking: vi.fn(),
        dismissBookingSheet: vi.fn(),
        isBookingInProgress: false,
        isBookingReady: mocks.isBookingReady,
        keepBookingForMore: () =>
          mocks.onKeepBookingForMore?.({ date: localDate('2026-05-20') }),
        requestBasketReview: vi.fn(),
        requestInitialBooking: mocks.requestInitialBooking,
      }
    },
  ),
}))

vi.mock('../use-availability-overview', () => ({
  useAvailabilityOverview: vi.fn(() => ({
    availabilityState: { status: 'loading' },
    loadMoreAvailability: vi.fn(),
    refreshAvailabilitySelection: mocks.refreshAvailabilitySelection,
  })),
}))

vi.mock('../use-availability-scope', () => ({
  useAvailabilityScope: vi.fn(() => ({
    selectCable: vi.fn(),
    selectedCable: 'pro',
  })),
}))

vi.mock('./AvailabilityOverviewContent', () => ({
  AvailabilityOverviewContent: vi.fn((props) => {
    mocks.availabilityOverviewContentProps = props
    const selection =
      props.basket.kind === 'basket'
        ? { date: localDate('2026-05-21') }
        : { date: localDate('2026-05-20') }

    return (
      <button
        type="button"
        onClick={() => {
          if (props.basket.kind === 'basket') {
            props.basket.onAddSelection(selection)
            return
          }

          props.onBookSelection?.(selection)
        }}
      >
        {props.basket.kind === 'basket'
          ? 'Add fixture slot'
          : 'Book fixture slot'}
      </button>
    )
  }),
}))

vi.mock('../../booking/components/BookingSheetFlow', () => ({
  BookingSheetFlow: vi.fn((props) => {
    mocks.bookingSheetFlowProps = props
    return null
  }),
}))

describe('AvailabilityScreen', () => {
  afterEach(() => {
    mocks.availabilityOverviewContentProps = undefined
    mocks.bookingSheetFlowProps = undefined
    mocks.bookingSheetState = { status: 'closed' }
    mocks.isBookingReady = false
    mocks.onKeepBookingForMore = undefined
    mocks.onBookingFinalized = undefined
    mocks.refreshAvailabilitySelection.mockClear()
    mocks.requestInitialBooking.mockClear()
  })

  it('requests an initial booking for the rendered immediate-booking slot', async () => {
    mocks.isBookingReady = true
    const expectedSelection = { date: localDate('2026-05-20') }
    const user = userEvent.setup()

    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Book fixture slot' }))

    expect(mocks.requestInitialBooking).toHaveBeenCalledWith(expectedSelection)
  })

  it('provides the required sheet continuation and basket clear actions', () => {
    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    const actions = mocks.bookingSheetFlowProps?.actions
    expect(actions).toBeDefined()
    if (actions === undefined) {
      throw new Error('Expected BookingSheetFlow actions')
    }

    expect(actions.basket.onClearSelection).toBeDefined()
    expect(actions.initial.continuation).toBe('add-more')
    if (actions.initial.continuation === 'add-more') {
      expect(actions.initial.onAddMore).toBeDefined()
    }
  })

  it('refreshes every distinct cable and date after a successful booking', async () => {
    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    await mocks.onBookingFinalized?.({
      result: { status: 'success' },
      selections: [
        {
          cableId: 'pro',
          date: localDate('2026-05-20'),
          endTime: '11:00',
          startTime: '10:00',
        },
        {
          cableId: 'easy',
          date: localDate('2026-05-21'),
          endTime: '11:00',
          startTime: '10:00',
        },
        {
          cableId: 'pro',
          date: localDate('2026-05-20'),
          endTime: '11:00',
          startTime: '10:00',
        },
      ],
    })

    expect(mocks.refreshAvailabilitySelection).toHaveBeenCalledTimes(2)
    expect(mocks.refreshAvailabilitySelection).toHaveBeenNthCalledWith(
      1,
      'pro',
      localDate('2026-05-20'),
    )
    expect(mocks.refreshAvailabilitySelection).toHaveBeenNthCalledWith(
      2,
      'easy',
      localDate('2026-05-21'),
    )
  })

})

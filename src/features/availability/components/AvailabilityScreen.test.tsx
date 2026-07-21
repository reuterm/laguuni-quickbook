import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
        actions: {
          basket: { onClearSelection: () => void }
          initial: { continuation: 'none' }
        }
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
        selections: ReadonlyArray<{ date: string }>
      }) => Promise<void>)
    | undefined,
  refreshAvailabilityDay: vi.fn(async () => {}),
  requestBooking: vi.fn(),
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
        requestBooking: mocks.requestBooking,
      }
    },
  ),
}))

vi.mock('../use-availability-overview', () => ({
  useAvailabilityOverview: vi.fn(() => ({
    availabilityState: { status: 'loading' },
    loadMoreAvailability: vi.fn(),
    refreshAvailabilityDay: mocks.refreshAvailabilityDay,
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
    mocks.refreshAvailabilityDay.mockClear()
    mocks.requestBooking.mockClear()
  })

  it('requests an initial booking for the rendered immediate-booking slot', async () => {
    mocks.isBookingReady = true
    const expectedSelection = { date: localDate('2026-05-20') }
    const user = userEvent.setup()

    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Book fixture slot' }))

    expect(mocks.requestBooking).toHaveBeenCalledWith('initial', [
      expectedSelection,
    ])
  })

  it('provides the required basket clear action', () => {
    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    expect(
      mocks.bookingSheetFlowProps?.actions.basket.onClearSelection,
    ).toBeDefined()
  })

  it('refreshes every distinct selected date after a successful booking', async () => {
    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    await mocks.onBookingFinalized?.({
      result: { status: 'success' },
      selections: [
        { date: localDate('2026-05-20') },
        { date: localDate('2026-05-21') },
        { date: localDate('2026-05-20') },
      ],
    })

    expect(mocks.refreshAvailabilityDay).toHaveBeenCalledTimes(2)
    expect(mocks.refreshAvailabilityDay).toHaveBeenNthCalledWith(
      1,
      localDate('2026-05-20'),
    )
    expect(mocks.refreshAvailabilityDay).toHaveBeenNthCalledWith(
      2,
      localDate('2026-05-21'),
    )
  })

  it('retains a basket selection added while a basket booking finalizes', async () => {
    mocks.isBookingReady = true
    const user = userEvent.setup()

    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    await user.click(
      screen.getByRole('button', { name: 'Select multiple slots' }),
    )
    await user.click(screen.getByRole('button', { name: 'Add fixture slot' }))
    mocks.availabilityOverviewContentProps?.basket.onReview()
    await user.click(screen.getByRole('button', { name: 'Add fixture slot' }))

    await mocks.onBookingFinalized?.({
      result: { status: 'success' },
      selections: [{ date: localDate('2026-05-21') }],
    })

    expect(
      mocks.availabilityOverviewContentProps?.basket.isSelected({
        date: localDate('2026-05-21'),
      }),
    ).toBe(true)
  })
})

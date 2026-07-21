import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { AvailabilityScreen } from './AvailabilityScreen'

const mocks = vi.hoisted(() => ({
  availabilityOverviewContentProps: undefined as
    | { bookingActionMode: string; onBookSelection?: unknown }
    | undefined,
  isBookingReady: false,
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
  useBookingSheetController: vi.fn(({ onBookingFinalized }) => {
    mocks.onBookingFinalized = onBookingFinalized

    return {
      bookingSheetState: { status: 'closed' },
      confirmBooking: vi.fn(),
      dismissBookingSheet: vi.fn(),
      isBookingInProgress: false,
      isBookingReady: mocks.isBookingReady,
      requestBooking: mocks.requestBooking,
    }
  }),
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
    return null
  }),
}))

describe('AvailabilityScreen', () => {
  afterEach(() => {
    mocks.availabilityOverviewContentProps = undefined
    mocks.isBookingReady = false
    mocks.onBookingFinalized = undefined
    mocks.refreshAvailabilityDay.mockClear()
    mocks.requestBooking.mockClear()
  })

  it('requests an initial booking for an immediate slot click when booking is enabled', () => {
    mocks.isBookingReady = true
    const expectedSelection = { date: localDate('2026-05-20') }

    render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    expect(mocks.availabilityOverviewContentProps).toMatchObject({
      bookingActionMode: 'enabled',
    })
    ;(
      mocks.availabilityOverviewContentProps?.onBookSelection as (
        selection: typeof expectedSelection,
      ) => void
    )(expectedSelection)

    expect(mocks.requestBooking).toHaveBeenCalledWith('initial', [
      expectedSelection,
    ])
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
})

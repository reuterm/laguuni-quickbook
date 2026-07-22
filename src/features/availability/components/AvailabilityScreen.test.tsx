import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BookingSlotSelection } from '@/domain/booking'
import { localDate } from '../../../../tests/local-date'
import type { BookingSheetFlowActions } from '../../booking/components/BookingSheetFlow'
import { AvailabilityScreen } from './AvailabilityScreen'

const currentSelection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-20'),
  endTime: '16:00',
  startTime: '15:00',
}
const proposedSelection = {
  cableId: 'easy' as const,
  date: localDate('2026-05-20'),
  endTime: '13:00',
  startTime: '12:00',
}

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
  bookingReplacementProps: undefined as
    | { pendingReplacement: unknown }
    | undefined,
  bookingBasket: {
    addSelection: vi.fn(),
    clearSelections: vi.fn(),
    clearSelectionsIfUnchanged: vi.fn(),
    isSelected: vi.fn(() => false),
    removeSelection: vi.fn(),
    revision: 0,
    selections: [] as readonly BookingSlotSelection[],
  },
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
  requestBooking: vi.fn(),
  selectedCable: 'pro' as 'easy' | 'hietsu' | 'pro',
  availabilityState: { status: 'loading' } as unknown,
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
    availabilityState: mocks.availabilityState,
    loadMoreAvailability: vi.fn(),
    refreshAvailabilitySelection: mocks.refreshAvailabilitySelection,
  })),
}))

vi.mock('../use-availability-scope', () => ({
  useAvailabilityScope: vi.fn(() => ({
    selectCable: vi.fn(),
    selectedCable: mocks.selectedCable,
  })),
}))

vi.mock('../use-booking-basket', () => ({
  useBookingBasket: vi.fn(() => mocks.bookingBasket),
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

vi.mock('./BookingReplacementSheet', () => ({
  BookingReplacementSheet: vi.fn((props) => {
    mocks.bookingReplacementProps = props
    return null
  }),
}))

describe('AvailabilityScreen', () => {
  afterEach(() => {
    mocks.availabilityOverviewContentProps = undefined
    mocks.bookingSheetFlowProps = undefined
    mocks.bookingReplacementProps = undefined
    mocks.bookingBasket = {
      addSelection: vi.fn(),
      clearSelections: vi.fn(),
      clearSelectionsIfUnchanged: vi.fn(),
      isSelected: vi.fn(() => false),
      removeSelection: vi.fn(),
      revision: 0,
      selections: [],
    }
    mocks.bookingSheetState = { status: 'closed' }
    mocks.isBookingReady = false
    mocks.onKeepBookingForMore = undefined
    mocks.onBookingFinalized = undefined
    mocks.refreshAvailabilitySelection.mockClear()
    mocks.requestBooking.mockClear()
    mocks.selectedCable = 'pro'
    mocks.availabilityState = { status: 'loading' }
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

  it('clears a pending replacement before availability refreshes finish after booking', async () => {
    let resolveRefresh: (() => void) | undefined
    mocks.refreshAvailabilitySelection.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveRefresh = resolve
      }),
    )
    const { rerender } = renderPendingReplacement()

    const onBookingFinalized = mocks.onBookingFinalized
    if (!onBookingFinalized) throw new Error('Expected booking finalization callback')

    const finalization = onBookingFinalized({
      result: { status: 'success' },
      selections: [currentSelection],
    })

    await act(async () => {})
    expect(mocks.bookingReplacementProps?.pendingReplacement).toBeNull()

    resolveRefresh?.()
    await finalization
    rerender(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)
  })

  it('clears a pending replacement when its current cable availability no longer renders the slot', () => {
    const { rerender } = renderPendingReplacement()
    mocks.selectedCable = 'pro'
    mocks.availabilityState = readyAvailability([])

    rerender(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    expect(mocks.bookingReplacementProps?.pendingReplacement).toBeNull()
  })

  it('clears a pending replacement when its proposed cable availability no longer renders the slot', () => {
    const { rerender } = renderPendingReplacement()
    mocks.selectedCable = 'easy'
    mocks.availabilityState = {
      ...readyAvailability([]),
      status: 'refreshing' as const,
    }

    rerender(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    expect(mocks.bookingReplacementProps?.pendingReplacement).toBeNull()
  })

  it('keeps a pending replacement when an inactive cable view does not render either slot', () => {
    const { rerender } = renderPendingReplacement()
    mocks.selectedCable = 'hietsu'
    mocks.availabilityState = readyAvailability([])

    rerender(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    expect(mocks.bookingReplacementProps?.pendingReplacement).toEqual({
      current: currentSelection,
      proposed: proposedSelection,
    })
  })

  it('keeps a pending replacement while its selected current slot remains rendered', () => {
    const { rerender } = renderPendingReplacement()
    mocks.selectedCable = 'pro'
    mocks.availabilityState = readyAvailability([currentSelection])

    rerender(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

    expect(mocks.bookingReplacementProps?.pendingReplacement).toEqual({
      current: currentSelection,
      proposed: proposedSelection,
    })
  })

  it('clears a pending replacement when its current selection is removed', () => {
    renderPendingReplacement()
    const removeSelection = mocks.availabilityOverviewContentProps?.basket
      .onRemoveSelection
    if (!removeSelection) throw new Error('Expected remove selection action')

    act(() => {
      removeSelection(currentSelection)
    })

    expect(mocks.bookingReplacementProps?.pendingReplacement).toBeNull()
  })

  it('clears a pending replacement when the review selection is cleared', () => {
    renderPendingReplacement()
    const clearSelection = mocks.bookingSheetFlowProps?.actions.basket
      .onClearSelection
    if (!clearSelection) throw new Error('Expected clear selection action')

    act(() => {
      clearSelection()
    })

    expect(mocks.bookingReplacementProps?.pendingReplacement).toBeNull()
  })
})

function renderPendingReplacement() {
  mocks.bookingBasket.selections = [currentSelection]
  mocks.selectedCable = 'easy'
  mocks.availabilityState = readyAvailability([proposedSelection])

  const rendered = render(<AvailabilityScreen isOnline onOpenSettings={vi.fn()} />)

  const addSelection = mocks.availabilityOverviewContentProps?.basket.onAddSelection
  if (!addSelection) throw new Error('Expected add selection action')

  act(() => {
    addSelection(proposedSelection)
  })

  expect(mocks.bookingReplacementProps?.pendingReplacement).toEqual({
    current: currentSelection,
    proposed: proposedSelection,
  })

  return rendered
}

function readyAvailability(selections: readonly BookingSlotSelection[]) {
  return {
    dayGroups: selections.map((selection) => ({
      date: selection.date,
      displayDate: 'Wed 20 May',
      slots: [selection],
    })),
    status: 'ready' as const,
  }
}

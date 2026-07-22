import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { groupAvailabilityWeeks } from '../availability-calendar'
import type { AvailabilityDayGroup } from '../availability-service'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { AvailabilityCalendarWeek } from './AvailabilityCalendarWeek'
import type { BookingBasketProps } from './booking-basket-props'

const FIXTURE_DAY_GROUPS: readonly AvailabilityDayGroup[] = [
  {
    date: localDate('2026-05-14'),
    displayDate: 'Thu 14 May',
    slots: [
      {
        endTime: '13:00',
        freeCapacity: 4,
        id: '2026-05-14-720',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-14'),
          endTime: '13:00',
          startTime: '12:00',
        },
        startTime: '12:00',
        totalCapacity: 4,
      },
      {
        endTime: '16:00',
        freeCapacity: 2,
        id: '2026-05-14-900',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-14'),
          endTime: '16:00',
          startTime: '15:00',
        },
        startTime: '15:00',
        totalCapacity: 4,
      },
      {
        endTime: '17:00',
        freeCapacity: 3,
        id: '2026-05-14-960',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-14'),
          endTime: '17:00',
          startTime: '16:00',
        },
        startTime: '16:00',
        totalCapacity: 4,
      },
    ],
  },
  {
    date: localDate('2026-05-15'),
    displayDate: 'Fri 15 May',
    slots: [
      {
        endTime: '14:00',
        freeCapacity: 1,
        id: '2026-05-15-780',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-15'),
          endTime: '14:00',
          startTime: '13:00',
        },
        startTime: '13:00',
        totalCapacity: 4,
      },
    ],
  },
  {
    date: localDate('2026-05-19'),
    displayDate: 'Tue 19 May',
    slots: [
      {
        endTime: '18:00',
        freeCapacity: 3,
        id: '2026-05-19-1020',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-19'),
          endTime: '18:00',
          startTime: '17:00',
        },
        startTime: '17:00',
        totalCapacity: 4,
      },
    ],
  },
]

const week = groupAvailabilityWeeks(FIXTURE_DAY_GROUPS)[0]

if (week === undefined) {
  throw new Error('Expected availability fixture to produce a week')
}
// @ts-expect-error Calendar weeks require a complete basket.
;<AvailabilityCalendarWeek
  bookingActionMode="hidden"
  visibleDayIndices={[0]}
  week={week}
/>

describe('AvailabilityCalendarGrid', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders weekly matrices trimmed to the visible range', () => {
    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket()}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
      />,
    )

    const tables = screen.getAllByRole('table')
    const firstWeekSection = screen
      .getByText('11 May - 17 May')
      .closest('section')
    const secondWeekSection = screen
      .getByText('18 May - 24 May')
      .closest('section')

    expect(tables).toHaveLength(2)
    expect(firstWeekSection).not.toBeNull()
    expect(secondWeekSection).not.toBeNull()

    if (!(firstWeekSection instanceof HTMLElement)) {
      throw new Error('Expected first week section')
    }

    if (!(secondWeekSection instanceof HTMLElement)) {
      throw new Error('Expected second week section')
    }

    expect(
      within(firstWeekSection).queryByRole('columnheader', { name: /Mon/i }),
    ).not.toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Thu 14 May 3 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(secondWeekSection).getByRole('columnheader', {
        name: /Tue 19 May 1 slot/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(secondWeekSection).queryByRole('columnheader', {
        name: /Mon 18 May 0 slots/i,
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '12:00' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('uses the badge itself as the booking trigger', () => {
    const onBookSelection = vi.fn()

    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket()}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="enabled"
        onBookSelection={onBookSelection}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Book 15:00-16:00, 2 spots free',
      }),
    )

    expect(onBookSelection).toHaveBeenCalledWith({
      cableId: 'pro',
      date: localDate('2026-05-14'),
      endTime: '16:00',
      startTime: '15:00',
    })
  })

  it('uses controlled add and remove actions for calendar slots', () => {
    const onAddSelection = vi.fn()
    const onRemoveSelection = vi.fn()

    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket({
          isSelected: (selection) => selection.startTime === '15:00',
          kind: 'basket',
          onAddSelection,
          onRemoveSelection,
        })}
        dayGroups={FIXTURE_DAY_GROUPS}
        onBookSelection={vi.fn()}
        bookingActionMode="enabled"
      />,
    )

    const selected = screen.getByRole('button', {
      name: /^Remove 15:00-16:00/,
    })

    const unselected = screen.getByRole('button', {
      name: /^Add 16:00-17:00/,
    })

    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(unselected).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(selected)
    fireEvent.click(unselected)

    expect(onRemoveSelection).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: '15:00' }),
    )
    expect(onAddSelection).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: '16:00' }),
    )
  })

  it('shows non-interactive badges in read-only mode', () => {
    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket()}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
      />,
    )

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByText(/^\d$/).length).toBeGreaterThan(0)
  })

  it('renders a simple dash for unavailable calendar cells', () => {
    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket()}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
      />,
    )

    const twelveRow = screen
      .getByRole('rowheader', { name: '12:00' })
      .closest('tr')

    if (!(twelveRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected 12:00 row')
    }

    expect(within(twelveRow).getByText('4')).toBeInTheDocument()
    expect(within(twelveRow).getAllByText('-').length).toBeGreaterThan(0)
  })

  it('uses the real media query branch for wider layouts', () => {
    stubMatchMedia(true)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket()}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
      />,
    )

    const firstWeekSection = screen
      .getByText('11 May - 17 May')
      .closest('section')

    if (!(firstWeekSection instanceof HTMLElement)) {
      throw new Error('Expected first week section')
    }

    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Mon 11 May 0 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Sun 17 May 0 slots/i,
      }),
    ).toBeInTheDocument()
  })

  it('skips rendering weeks that have no bookable slots at all', () => {
    stubMatchMedia(true)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        basket={createBasket()}
        dayGroups={[
          ...FIXTURE_DAY_GROUPS,
          {
            date: localDate('2026-05-25'),
            displayDate: 'Mon 25 May',
            slots: [],
          },
          {
            date: localDate('2026-05-26'),
            displayDate: 'Tue 26 May',
            slots: [],
          },
          {
            date: localDate('2026-05-27'),
            displayDate: 'Wed 27 May',
            slots: [],
          },
          {
            date: localDate('2026-05-28'),
            displayDate: 'Thu 28 May',
            slots: [],
          },
          {
            date: localDate('2026-05-29'),
            displayDate: 'Fri 29 May',
            slots: [],
          },
          {
            date: localDate('2026-05-30'),
            displayDate: 'Sat 30 May',
            slots: [],
          },
          {
            date: localDate('2026-05-31'),
            displayDate: 'Sun 31 May',
            slots: [],
          },
        ]}
        bookingActionMode="hidden"
      />,
    )

    expect(screen.queryByText('25 May - 31 May')).not.toBeInTheDocument()
  })
})

function createBasket(
  overrides: Partial<BookingBasketProps> = {},
): BookingBasketProps {
  return {
    isSelected: () => false,
    kind: 'initial',
    onAddSelection: () => {},
    onRemoveSelection: () => {},
    onReview: () => {},
    selections: [],
    ...overrides,
  }
}

// @ts-expect-error A basket must have every selection and review member.
const incompleteBasket: BookingBasketProps = {
  selections: [],
  isSelected: () => false,
  onAddSelection: () => {},
  onRemoveSelection: () => {},
}
void incompleteBasket

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  window.matchMedia = globalThis.matchMedia
}

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AvailabilityDayGroup } from '../availability-service'
import {
  AvailabilityCalendarGrid,
  groupAvailabilityWeeks,
  listVisibleWeekdayIndices,
} from './AvailabilityCalendarGrid'

const FIXTURE_DAY_GROUPS: readonly AvailabilityDayGroup[] = [
  {
    date: '2026-05-14',
    displayDate: 'Thu 14 May',
    slots: [
      {
        endTime: '13:00',
        freeCapacity: 4,
        id: '2026-05-14-720',
        selection: {
          cableId: 'pro',
          date: '2026-05-14',
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
          date: '2026-05-14',
          endTime: '16:00',
          startTime: '15:00',
        },
        startTime: '15:00',
        totalCapacity: 4,
      },
    ],
  },
  {
    date: '2026-05-15',
    displayDate: 'Fri 15 May',
    slots: [
      {
        endTime: '14:00',
        freeCapacity: 1,
        id: '2026-05-15-780',
        selection: {
          cableId: 'pro',
          date: '2026-05-15',
          endTime: '14:00',
          startTime: '13:00',
        },
        startTime: '13:00',
        totalCapacity: 4,
      },
    ],
  },
  {
    date: '2026-05-19',
    displayDate: 'Tue 19 May',
    slots: [
      {
        endTime: '18:00',
        freeCapacity: 3,
        id: '2026-05-19-1020',
        selection: {
          cableId: 'pro',
          date: '2026-05-19',
          endTime: '18:00',
          startTime: '17:00',
        },
        startTime: '17:00',
        totalCapacity: 4,
      },
    ],
  },
]

describe('AvailabilityCalendarGrid', () => {
  afterEach(() => {
    cleanup()
  })

  it('groups availability into monday-to-sunday weeks', () => {
    expect(groupAvailabilityWeeks(FIXTURE_DAY_GROUPS)).toMatchObject([
      {
        days: [
          null,
          null,
          null,
          FIXTURE_DAY_GROUPS[0],
          FIXTURE_DAY_GROUPS[1],
          null,
          null,
        ],
        id: '2026-05-11',
        label: '11 May - 17 May',
      },
      {
        days: [null, FIXTURE_DAY_GROUPS[2], null, null, null, null, null],
        id: '2026-05-18',
        label: '18 May - 24 May',
      },
    ])
  })

  it('shows only weekday columns that fall inside the loaded range', () => {
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-11T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        false,
      ),
    ).toEqual([3, 4, 5, 6])
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-18T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        false,
      ),
    ).toEqual([0, 1, 2])
  })

  it('shows full monday-to-sunday columns at wider breakpoints', () => {
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-11T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        true,
      ),
    ).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('renders weekly matrices trimmed to the visible range', () => {
    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
        showFullWeekColumns={false}
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
      within(firstWeekSection).queryByRole('columnheader', { name: /Tue/i }),
    ).not.toBeInTheDocument()
    expect(
      within(firstWeekSection).queryByRole('columnheader', { name: /Wed/i }),
    ).not.toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Thu 14 May 2 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Fri 15 May 1 slot/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Sat 16 May 0 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Sun 17 May 0 slots/i,
      }),
    ).toBeInTheDocument()

    expect(
      within(secondWeekSection).getByRole('columnheader', {
        name: /Mon 18 May 0 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(secondWeekSection).getByRole('columnheader', {
        name: /Tue 19 May 1 slot/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(secondWeekSection).queryByRole('columnheader', { name: /Thu/i }),
    ).not.toBeInTheDocument()
    expect(within(firstWeekSection).queryByText('-')).not.toBeInTheDocument()

    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByText('13:00')).toBeInTheDocument()
    expect(screen.getByText('15:00')).toBeInTheDocument()
    expect(screen.getByText('17:00')).toBeInTheDocument()
    expect(screen.getByText('4/4')).toBeInTheDocument()
    expect(screen.getByText('2/4')).toBeInTheDocument()
    expect(screen.getByText('1/4')).toBeInTheDocument()
    expect(screen.getByText('3/4')).toBeInTheDocument()
  })

  it('uses the badge itself as the booking trigger', () => {
    const onBookSelection = vi.fn()

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="enabled"
        onBookSelection={onBookSelection}
        showFullWeekColumns={false}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Book 15:00-16:00, 2/4 spots free',
      }),
    )

    expect(onBookSelection).toHaveBeenCalledWith({
      cableId: 'pro',
      date: '2026-05-14',
      endTime: '16:00',
      startTime: '15:00',
    })
  })

  it('shows non-interactive badges in read-only mode', () => {
    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
        showFullWeekColumns={false}
      />,
    )

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByText(/\d\/4/).length).toBeGreaterThan(0)
  })

  it('renders full 8-column week matrices on wider layouts', () => {
    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
        showFullWeekColumns
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
        name: /Tue 12 May 0 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Wed 13 May 0 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Thu 14 May 2 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(firstWeekSection).getByRole('columnheader', {
        name: /Sun 17 May 0 slots/i,
      }),
    ).toBeInTheDocument()
  })
})

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AvailabilityDayGroup } from '../availability-service'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'

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
    vi.unstubAllGlobals()
  })

  it('renders weekly matrices trimmed to the visible range', () => {
    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
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
        name: /Thu 14 May 2 slots/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(secondWeekSection).getByRole('columnheader', {
        name: /Tue 19 May 1 slot/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '12:00' })).toBeInTheDocument()
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('uses the badge itself as the booking trigger', () => {
    const onBookSelection = vi.fn()

    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="enabled"
        onBookSelection={onBookSelection}
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
    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
      />,
    )

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByText(/\d\/4/).length).toBeGreaterThan(0)
  })

  it('renders a simple dash for unavailable calendar cells', () => {
    stubMatchMedia(false)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
        dayGroups={FIXTURE_DAY_GROUPS}
        bookingActionMode="hidden"
      />,
    )

    const twelveRow = screen.getByRole('rowheader', { name: '12:00' }).closest('tr')

    if (!(twelveRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected 12:00 row')
    }

    expect(within(twelveRow).getByText('4/4')).toBeInTheDocument()
    expect(within(twelveRow).getAllByText('-').length).toBeGreaterThan(0)
  })

  it('uses the real media query branch for wider layouts', () => {
    stubMatchMedia(true)

    render(
      <AvailabilityCalendarGrid
        availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
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
})

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

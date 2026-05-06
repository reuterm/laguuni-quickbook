import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

describe('AvailabilityOverviewContent', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the loading state', () => {
    renderContent({
      status: 'loading',
    })

    expect(screen.getByText('Loading availability…')).toBeInTheDocument()
  })

  it('keeps rendered slots visible while refreshing availability', () => {
    renderContent({
      dayGroups: [
        {
          date: '2026-05-14',
          displayDate: 'Thu 14 May',
          slots: [
            {
              endTime: '16:00',
              freeCapacity: 3,
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
      ],
      status: 'refreshing',
    })

    expect(screen.getByText('Refreshing availability…')).toBeInTheDocument()
    expect(screen.getByText('3/4')).toBeInTheDocument()
    expect(screen.queryByText('Loading availability…')).not.toBeInTheDocument()
  })

  it('renders API errors as alerts', () => {
    renderContent({
      message: 'Fixture outage',
      status: 'error',
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Fixture outage')
  })

  it('renders a cable-specific empty state', () => {
    renderContent({
      dayGroups: [],
      status: 'ready',
    })

    expect(
      screen.getByText(/No bookable one-hour slots are available for Pro/),
    ).toBeInTheDocument()
  })

  it('hides booking actions in read-only mode', () => {
    renderContent(
      {
        dayGroups: [
          {
            date: '2026-05-14',
            displayDate: 'Thu 14 May',
            slots: [
              {
                endTime: '16:00',
                freeCapacity: 3,
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
        ],
        status: 'ready',
      },
      { bookingActionMode: 'hidden' },
    )

    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()
  })

  it('renders bookable slot groups and wires the book action', () => {
    const onBookSelection = vi.fn()

    renderContent(
      {
        dayGroups: [
          {
            date: '2026-05-14',
            displayDate: 'Thu 14 May',
            slots: [
              {
                endTime: '16:00',
                freeCapacity: 3,
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
        ],
        status: 'ready',
      },
      {
        bookingActionMode: 'enabled',
        onBookSelection,
      },
    )

    expect(screen.getByRole('button', { name: 'Book' })).toBeEnabled()
  })

  it('disables booking actions while a booking is already in progress', () => {
    renderContent(
      {
        dayGroups: [
          {
            date: '2026-05-14',
            displayDate: 'Thu 14 May',
            slots: [
              {
                endTime: '16:00',
                freeCapacity: 3,
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
        ],
        status: 'ready',
      },
      { bookingActionMode: 'disabled' },
    )

    expect(screen.getByRole('button', { name: 'Book' })).toBeDisabled()
  })
})

function renderContent(
  availabilityState: AvailabilityState,
  bookingProps?: Pick<
    Parameters<typeof AvailabilityOverviewContent>[0],
    'bookingActionMode' | 'onBookSelection'
  >,
) {
  if (
    bookingProps === undefined ||
    bookingProps.bookingActionMode === 'enabled'
  ) {
    return render(
      <AvailabilityOverviewContent
        activeCableLabel="Pro"
        availabilityState={availabilityState}
        bookingActionMode="enabled"
        onBookSelection={bookingProps?.onBookSelection ?? vi.fn()}
      />,
    )
  }

  return render(
    <AvailabilityOverviewContent
      activeCableLabel="Pro"
      availabilityState={availabilityState}
      bookingActionMode={bookingProps.bookingActionMode}
    />,
  )
}

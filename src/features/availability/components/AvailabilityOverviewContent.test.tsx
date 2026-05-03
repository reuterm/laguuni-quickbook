import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

describe('AvailabilityOverviewContent', () => {
  it('renders the loading state', () => {
    renderContent({
      status: 'loading',
    })

    expect(screen.getByText('Loading availability…')).toBeInTheDocument()
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
                availabilityLabel: '3/4 free',
                endTime: '16:00',
                id: '2026-05-14-900',
                selection: {
                  cableId: 'pro',
                  date: '2026-05-14',
                  endTime: '16:00',
                  startTime: '15:00',
                },
                startTime: '15:00',
              },
            ],
          },
        ],
        status: 'ready',
      },
      onBookSelection,
    )

    expect(screen.getByText('Thu 14 May')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Book' })).toBeEnabled()
  })
})

function renderContent(
  availabilityState: AvailabilityState,
  onBookSelection?: Parameters<
    typeof AvailabilityOverviewContent
  >[0]['onBookSelection'],
) {
  return render(
    <AvailabilityOverviewContent
      activeCableLabel="Pro"
      availabilityState={availabilityState}
      onBookSelection={onBookSelection}
    />,
  )
}

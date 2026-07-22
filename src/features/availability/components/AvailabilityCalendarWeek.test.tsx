import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { AvailabilityCalendarWeek } from './AvailabilityCalendarWeek'
import type { BookingBasketProps } from './booking-basket-props'

const selectedSlot = {
  endTime: '16:00',
  freeCapacity: 4,
  id: '2026-05-14-900',
  selection: {
    cableId: 'pro' as const,
    date: localDate('2026-05-11'),
    endTime: '16:00',
    startTime: '15:00',
  },
  startTime: '15:00',
  totalCapacity: 4,
}

const unselectedSlot = {
  endTime: '13:00',
  freeCapacity: 2,
  id: '2026-05-14-720',
  selection: {
    cableId: 'pro' as const,
    date: localDate('2026-05-11'),
    endTime: '13:00',
    startTime: '12:00',
  },
  startTime: '12:00',
  totalCapacity: 4,
}

const week = {
  days: [
    {
      date: localDate('2026-05-11'),
      displayDate: 'Mon 11 May',
      slots: [selectedSlot, unselectedSlot],
    },
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  id: '2026-05-11',
  label: '11 May - 17 May',
  weekStartDate: new Date('2026-05-11T12:00:00'),
}

describe('AvailabilityCalendarWeek', () => {
  afterEach(cleanup)

  it('marks basket selections pressed', () => {
    render(
      <AvailabilityCalendarWeek
        basket={createBasket({
          isSelected: (selection) => selection.startTime === '15:00',
          kind: 'basket',
        })}
        bookingActionMode="enabled"
        onBookSelection={vi.fn()}
        visibleDayIndices={[0]}
        week={week}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Remove 15:00-16:00, 4 spots free',
        pressed: true,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Book 12:00-13:00, 2 spots free',
        pressed: false,
      }),
    ).toBeInTheDocument()
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

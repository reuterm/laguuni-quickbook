import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'
import type { BookingBasketProps } from './booking-basket-props'

describe('AvailabilityDayGroups', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders each loaded day group as its own stacked section', () => {
    render(
      <AvailabilityDayGroups
        dayGroups={[
          createDayGroup({
            date: localDate('2026-05-14'),
            displayDate: 'Thu 14 May',
            slots: [createSlot('2026-05-14-900', '15:00', '16:00')],
          }),
          createDayGroup({
            date: localDate('2026-05-15'),
            displayDate: 'Fri 15 May',
            slots: [createSlot('2026-05-15-780', '13:00', '14:00')],
          }),
        ]}
        basket={createBasket()}
        bookingActionMode="hidden"
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Thu 14 May', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Fri 15 May', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Read only')).toHaveLength(2)
  })

  it('renders booking actions when booking is enabled', () => {
    const onBookSelection = vi.fn()

    render(
      <AvailabilityDayGroups
        dayGroups={[
          createDayGroup({
            date: localDate('2026-05-14'),
            displayDate: 'Thu 14 May',
            slots: [createSlot('2026-05-14-900', '15:00', '16:00')],
          }),
        ]}
        basket={createBasket()}
        bookingActionMode="enabled"
        onBookSelection={onBookSelection}
      />,
    )

    const bookButton = screen.getByRole('button', { name: 'Book' })
    expect(bookButton).toBeEnabled()
    bookButton.click()
    expect(onBookSelection).toHaveBeenCalledOnce()
  })

  it('disables booking actions when booking is disabled', () => {
    render(
      <AvailabilityDayGroups
        dayGroups={[
          createDayGroup({
            date: localDate('2026-05-14'),
            displayDate: 'Thu 14 May',
            slots: [createSlot('2026-05-14-900', '15:00', '16:00')],
          }),
        ]}
        basket={createBasket()}
        bookingActionMode="disabled"
        onBookSelection={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Book' })).not.toHaveLength(0)

    for (const button of screen.getAllByRole('button', { name: 'Book' })) {
      expect(button).toBeDisabled()
    }
  })

  it('uses controlled add and remove actions for list slots', async () => {
    const onAddSelection = vi.fn()
    const onRemoveSelection = vi.fn()
    const user = userEvent.setup()

    render(
      <AvailabilityDayGroups
        dayGroups={[
          createDayGroup({
            date: localDate('2026-05-14'),
            displayDate: 'Thu 14 May',
            slots: [
              createSlot('2026-05-14-900', '15:00', '16:00'),
              createSlot('2026-05-14-720', '12:00', '13:00'),
            ],
          }),
        ]}
        basket={createBasket({
          isSelected: (selection) => selection.startTime === '15:00',
          onAddSelection,
          onRemoveSelection,
          kind: 'basket',
        })}
        bookingActionMode="enabled"
        onBookSelection={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Remove 15:00-16:00, 3 spots free' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Add 12:00-13:00, 3 spots free' }),
    )

    expect(
      screen.getByRole('button', {
        name: 'Remove 15:00-16:00, 3 spots free',
        pressed: true,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Add 12:00-13:00, 3 spots free',
        pressed: false,
      }),
    ).toBeInTheDocument()
    expect(onRemoveSelection).toHaveBeenCalledOnce()
    expect(onAddSelection).toHaveBeenCalledOnce()
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

function createDayGroup({
  date,
  displayDate,
  slots,
}: {
  date: ReturnType<typeof localDate>
  displayDate: string
  slots: Array<ReturnType<typeof createSlot>>
}) {
  return {
    date,
    displayDate,
    slots,
  }
}

function createSlot(id: string, startTime: string, endTime: string) {
  return {
    endTime,
    freeCapacity: 3,
    id,
    selection: {
      cableId: 'pro' as const,
      date: localDate('2026-05-14'),
      endTime,
      startTime,
    },
    startTime,
    totalCapacity: 4,
  }
}

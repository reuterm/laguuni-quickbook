import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'

describe('AvailabilityDayGroups', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders each loaded day group as its own stacked section', () => {
    render(
      <AvailabilityDayGroups
        bookingActionMode="hidden"
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
    render(
      <AvailabilityDayGroups
        bookingActionMode="enabled"
        dayGroups={[
          createDayGroup({
            date: localDate('2026-05-14'),
            displayDate: 'Thu 14 May',
            slots: [createSlot('2026-05-14-900', '15:00', '16:00')],
          }),
        ]}
        onBookSelection={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Book' })).toBeEnabled()
  })

  it('disables booking actions when booking is disabled', () => {
    render(
      <AvailabilityDayGroups
        bookingActionMode="disabled"
        dayGroups={[
          createDayGroup({
            date: localDate('2026-05-14'),
            displayDate: 'Thu 14 May',
            slots: [createSlot('2026-05-14-900', '15:00', '16:00')],
          }),
        ]}
        onBookSelection={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Book' })).not.toHaveLength(0)

    for (const button of screen.getAllByRole('button', { name: 'Book' })) {
      expect(button).toBeDisabled()
    }
  })
})

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

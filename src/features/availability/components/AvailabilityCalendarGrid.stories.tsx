import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import {
  CALENDAR_DAY_GROUPS,
  createSelection,
  noop,
  STORYBOOK_REFERENCE_DATE,
} from '$storybook/fixture-data'

import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { BasketReviewAction } from './BasketReviewAction'
import { emptyBookingBasket } from './booking-basket-props'

const meta = {
  component: AvailabilityCalendarGrid,
  title: 'Availability/CalendarGrid',
} satisfies Meta<typeof AvailabilityCalendarGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    availabilityReferenceDate: STORYBOOK_REFERENCE_DATE,
    basket: emptyBookingBasket,
    bookingActionMode: 'enabled',
    dayGroups: CALENDAR_DAY_GROUPS,
    onBookSelection: noop,
  },
}

export const BasketSelection: Story = {
  render: () => <BasketSelectionCalendar />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', {
        name: 'Remove 15:00-16:00, 3 spots free',
        pressed: true,
      }),
    ).toBeInTheDocument()

    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Remove 15:00-16:00, 3 spots free',
      }),
    )
    await expect(onRemoveSelection).toHaveBeenCalled()
  },
}

const onReview = fn()
const selectedFixture = [createSelection()]
const onRemoveSelection = fn()

function BasketSelectionCalendar() {
  const bookingBasket = {
    isSelected: (selection: (typeof selectedFixture)[number]) =>
      selectedFixture.some(
        (item) =>
          item.cableId === selection.cableId &&
          item.date === selection.date &&
          item.endTime === selection.endTime &&
          item.startTime === selection.startTime,
      ),
    kind: 'basket' as const,
    onAddSelection: noop,
    onRemoveSelection,
    onReview,
    selections: selectedFixture,
  }

  return (
    <>
      <BasketReviewAction
        selections={bookingBasket.selections}
        onReview={bookingBasket.onReview}
      />
      <AvailabilityCalendarGrid
        availabilityReferenceDate={STORYBOOK_REFERENCE_DATE}
        basket={bookingBasket}
        bookingActionMode="enabled"
        dayGroups={CALENDAR_DAY_GROUPS}
        onBookSelection={noop}
      />
    </>
  )
}

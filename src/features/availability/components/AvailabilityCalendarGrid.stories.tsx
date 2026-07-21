import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import {
  CALENDAR_DAY_GROUPS,
  noop,
  STORYBOOK_REFERENCE_DATE,
} from '$storybook/fixture-data'

import { useBookingBasket } from '../use-booking-basket'
import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'
import { BookingBasketReviewButton } from './BookingBasketReviewButton'

const meta = {
  component: AvailabilityCalendarGrid,
  title: 'Availability/CalendarGrid',
} satisfies Meta<typeof AvailabilityCalendarGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    availabilityReferenceDate: STORYBOOK_REFERENCE_DATE,
    bookingActionMode: 'enabled',
    dayGroups: CALENDAR_DAY_GROUPS,
    onBookSelection: noop,
  },
}

export const BasketSelection: Story = {
  render: () => <BasketSelectionCalendar />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: /^Add\b/ })[0])

    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Review selection 1 selected slot',
      }),
    )
    await expect(onReview).toHaveBeenCalled()
  },
}

const onReview = fn()

function BasketSelectionCalendar() {
  const basket = useBookingBasket()

  return (
    <>
      <BookingBasketReviewButton
        selections={basket.selections}
        onReview={onReview}
      />
      <AvailabilityCalendarGrid
        availabilityReferenceDate={STORYBOOK_REFERENCE_DATE}
        bookingActionMode="enabled"
        dayGroups={CALENDAR_DAY_GROUPS}
        isSelected={basket.isSelected}
        onAddSelection={basket.addSelection}
        onBookSelection={noop}
        onRemoveSelection={basket.removeSelection}
      />
    </>
  )
}

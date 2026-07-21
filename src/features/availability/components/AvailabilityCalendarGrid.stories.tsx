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
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Book 12:00-13:00, 4 spots free',
      }),
    )

    await userEvent.click(
      canvas.getByRole('button', {
        name: '1 slot selected',
      }),
    )
    await expect(onReview).toHaveBeenCalled()

    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Book 12:00-13:00, 4 spots free',
      }),
    )
    await expect(
      canvas.queryByRole('button', {
        name: '1 slot selected',
      }),
    ).not.toBeInTheDocument()
  },
}

const onReview = fn()

function BasketSelectionCalendar() {
  const basket = useBookingBasket()
  const bookingBasket = {
    isSelected: basket.isSelected,
    kind: 'basket' as const,
    onAddSelection: basket.addSelection,
    onRemoveSelection: basket.removeSelection,
    onReview,
    selections: basket.selections,
  }

  return (
    <>
      <BookingBasketReviewButton
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

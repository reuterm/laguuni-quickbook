import type { Meta, StoryObj } from '@storybook/react-vite'

import { createAvailabilityWeek, noop } from '$storybook/fixture-data'

import { AvailabilityCalendarWeek } from './AvailabilityCalendarWeek'
import { emptyBookingBasket } from './booking-basket-props'

const meta = {
  component: AvailabilityCalendarWeek,
  title: 'Availability/CalendarWeek',
} satisfies Meta<typeof AvailabilityCalendarWeek>

export default meta

type Story = StoryObj<typeof meta>

export const Enabled: Story = {
  args: {
    bookingActionMode: 'enabled',
    basketKind: emptyBookingBasket.kind,
    isSelected: emptyBookingBasket.isSelected,
    onAddSelection: emptyBookingBasket.onAddSelection,
    onBookSelection: noop,
    onRemoveSelection: emptyBookingBasket.onRemoveSelection,
    visibleDayIndices: [3, 4],
    week: createAvailabilityWeek(),
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'

import { createAvailabilityWeek, noop } from '$storybook/fixture-data'

import { AvailabilityCalendarWeek } from './AvailabilityCalendarWeek'

const meta = {
  component: AvailabilityCalendarWeek,
  title: 'Availability/CalendarWeek',
} satisfies Meta<typeof AvailabilityCalendarWeek>

export default meta

type Story = StoryObj<typeof meta>

export const Enabled: Story = {
  args: {
    bookingActionMode: 'enabled',
    isSelected: () => false,
    onAddSelection: noop,
    onBookSelection: noop,
    onRemoveSelection: noop,
    selectionMode: false,
    visibleDayIndices: [3, 4],
    week: createAvailabilityWeek(),
  },
}

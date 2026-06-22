import type { Meta, StoryObj } from '@storybook/react-vite'

import { BOOKABLE_DAY_GROUPS, noop } from '@/storybook/fixtures'

import { AvailabilityDayGroups } from './AvailabilityDayGroups'

const meta = {
  component: AvailabilityDayGroups,
  title: 'Availability/DayGroups',
} satisfies Meta<typeof AvailabilityDayGroups>

export default meta

type Story = StoryObj<typeof meta>

export const Enabled: Story = {
  args: {
    bookingActionMode: 'enabled',
    dayGroups: BOOKABLE_DAY_GROUPS,
    onBookSelection: noop,
  },
}

export const ReadOnly: Story = {
  args: {
    bookingActionMode: 'hidden',
    dayGroups: BOOKABLE_DAY_GROUPS,
  },
}

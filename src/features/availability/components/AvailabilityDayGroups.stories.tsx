import type { Meta, StoryObj } from '@storybook/react-vite'

import { BOOKABLE_DAY_GROUPS, noop } from '$storybook/fixture-data'

import { AvailabilityDayGroups } from './AvailabilityDayGroups'

type AvailabilityDayGroupsStoryArgs = {
  bookingActionMode: 'disabled' | 'enabled' | 'hidden'
  dayGroups: Parameters<typeof AvailabilityDayGroups>[0]['dayGroups']
}

const meta = {
  argTypes: {
    bookingActionMode: {
      control: 'inline-radio',
      options: ['enabled', 'disabled', 'hidden'],
    },
    onBookSelection: {
      control: false,
    },
  },
  component: AvailabilityDayGroups,
  title: 'Availability/DayGroups',
} satisfies Meta<AvailabilityDayGroupsStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    bookingActionMode: 'enabled',
    dayGroups: BOOKABLE_DAY_GROUPS,
  },
  render: ({ bookingActionMode, ...args }) => (
    <AvailabilityDayGroups
      {...args}
      bookingActionMode={bookingActionMode}
      {...(bookingActionMode === 'hidden'
        ? {}
        : {
            onBookSelection: noop,
          })}
    />
  ),
}

import type { Meta, StoryObj } from '@storybook/react'

import {
  CALENDAR_DAY_GROUPS,
  STORYBOOK_REFERENCE_DATE,
  noop,
} from '@/storybook/fixtures'

import { AvailabilityCalendarGrid } from './AvailabilityCalendarGrid'

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

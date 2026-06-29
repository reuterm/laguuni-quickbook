import type { Meta, StoryObj } from '@storybook/react-vite'

import { STORYBOOK_REFERENCE_DATE } from '$storybook/fixture-data'
import { withMatchMedia } from '$storybook/fixtures'

import { AVAILABILITY_CALENDAR_BREAKPOINT_QUERY } from '../availability-calendar'
import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'

const meta = {
  component: AvailabilityCalendarLoadingGrid,
  title: 'Availability/CalendarLoadingGrid',
} satisfies Meta<typeof AvailabilityCalendarLoadingGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [withMatchMedia(AVAILABILITY_CALENDAR_BREAKPOINT_QUERY, true)],
  render: () => (
    <AvailabilityCalendarLoadingGrid
      availabilityReferenceDate={STORYBOOK_REFERENCE_DATE}
    />
  ),
}

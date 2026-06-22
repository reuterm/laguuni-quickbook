import type { Meta, StoryObj } from '@storybook/react'

import {
  MatchMediaState,
  STORYBOOK_REFERENCE_DATE,
} from '@/storybook/fixtures'

import { AvailabilityCalendarLoadingGrid } from './AvailabilityCalendarLoadingGrid'

const meta = {
  component: AvailabilityCalendarLoadingGrid,
  title: 'Availability/CalendarLoadingGrid',
} satisfies Meta<typeof AvailabilityCalendarLoadingGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <MatchMediaState matches>
      <AvailabilityCalendarLoadingGrid
        availabilityReferenceDate={STORYBOOK_REFERENCE_DATE}
      />
    </MatchMediaState>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'

import { STORYBOOK_REFERENCE_DATE } from '$storybook/fixture-data'
import { withMatchMedia } from '$storybook/fixtures'

import { AVAILABILITY_CALENDAR_BREAKPOINT_QUERY } from '../availability-calendar'
import { AvailabilityLoadingSkeleton } from './AvailabilityLoadingSkeleton'
import type { AvailabilityOverviewContentModel } from './availability-overview-content-model'

const meta = {
  component: AvailabilityLoadingSkeleton,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Availability/LoadingSkeleton',
} satisfies Meta<typeof AvailabilityLoadingSkeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Cards: Story = {
  args: {
    availabilityReferenceDate: STORYBOOK_REFERENCE_DATE,
    contentModel: createContentModel(false),
    skeletonCount: 2,
  },
}

export const Calendar: Story = {
  args: {
    availabilityReferenceDate: STORYBOOK_REFERENCE_DATE,
    contentModel: createContentModel(true),
    skeletonCount: 2,
  },
  decorators: [withMatchMedia(AVAILABILITY_CALENDAR_BREAKPOINT_QUERY, true)],
}

function createContentModel(
  isCalendarView: boolean,
): AvailabilityOverviewContentModel {
  return {
    hasAppendError: false,
    hasLoadedDayGroups: false,
    hasRenderedAvailability: false,
    isCalendarView,
    renderedCardDayGroups: [],
    renderedDayGroups: [],
  }
}

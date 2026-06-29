import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  BOOKABLE_DAY_GROUPS,
  BOOKING_ENABLED_SETTINGS,
  CALENDAR_DAY_GROUPS,
  CALENDAR_VIEW_SETTINGS,
  createReadyAvailabilityState,
  createRefreshingAvailabilityState,
  EMPTY_DAY_GROUPS,
  noop,
  noopAsync,
} from '$storybook/fixture-data'

import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

const meta = {
  component: AvailabilityOverviewContent,
  title: 'Availability/OverviewContent',
} satisfies Meta<typeof AvailabilityOverviewContent>

export default meta

type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: {
    activeCableLabel: 'Pro',
    availabilityState: { isLoadingMore: false, status: 'loading' },
    bookingActionMode: 'hidden',
    onLoadMore: noopAsync,
  },
  parameters: {
    settings: CALENDAR_VIEW_SETTINGS,
  },
}

export const Refreshing: Story = {
  args: {
    activeCableLabel: 'Pro',
    availabilityState: createRefreshingAvailabilityState(CALENDAR_DAY_GROUPS),
    bookingActionMode: 'enabled',
    onBookSelection: noop,
    onLoadMore: noopAsync,
  },
  parameters: {
    settings: CALENDAR_VIEW_SETTINGS,
  },
}

export const Empty: Story = {
  args: {
    activeCableLabel: 'Pro',
    availabilityState: createReadyAvailabilityState(EMPTY_DAY_GROUPS),
    bookingActionMode: 'hidden',
    onLoadMore: noopAsync,
  },
  parameters: {
    settings: CALENDAR_VIEW_SETTINGS,
  },
}

export const AppendError: Story = {
  args: {
    activeCableLabel: 'Pro',
    availabilityState: createReadyAvailabilityState(BOOKABLE_DAY_GROUPS, {
      appendErrorMessage: 'Could not load the next week.',
    }),
    bookingActionMode: 'enabled',
    onBookSelection: noop,
    onLoadMore: noopAsync,
  },
  parameters: {
    settings: BOOKING_ENABLED_SETTINGS,
  },
}

export const Offline: Story = {
  args: {
    activeCableLabel: 'Pro',
    availabilityState: createReadyAvailabilityState(BOOKABLE_DAY_GROUPS),
    bookingActionMode: 'hidden',
    isOffline: true,
    onLoadMore: noopAsync,
  },
  parameters: {
    settings: BOOKING_ENABLED_SETTINGS,
  },
}

export const ApiError: Story = {
  args: {
    activeCableLabel: 'Pro',
    availabilityState: {
      isLoadingMore: false,
      message: 'Fixture outage',
      status: 'error',
    },
    bookingActionMode: 'hidden',
    onLoadMore: noopAsync,
  },
}

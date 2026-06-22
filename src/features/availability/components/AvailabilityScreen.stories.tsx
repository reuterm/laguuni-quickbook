import type { Meta, StoryObj } from '@storybook/react'

import { createLaguuniHandlers } from '../../../../tests/msw/handlers/laguuni'
import { BOOKING_ENABLED_SETTINGS, noop } from '@/storybook/fixtures'

import { AvailabilityScreen } from './AvailabilityScreen'

const storybookLaguuniHandlers = createLaguuniHandlers(
  'https://shop.laguuniin.fi',
)

const meta = {
  component: AvailabilityScreen,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storybookLaguuniHandlers,
    },
  },
  title: 'Availability/Screen',
} satisfies Meta<typeof AvailabilityScreen>

export default meta

type Story = StoryObj<typeof meta>

export const ReadOnly: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
}

export const BookingEnabled: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    settings: BOOKING_ENABLED_SETTINGS,
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { BOOKING_ENABLED_SETTINGS, noop } from '$storybook/fixture-data'
import { createStorybookLaguuniParameters } from '../../../../.storybook/laguuni-handlers'
import { StorybookAppFrame } from '../../../../.storybook/StorybookAppFrame'

import { AvailabilityScreen } from './AvailabilityScreen'

const meta = {
  component: AvailabilityScreen,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Availability/Screen',
} satisfies Meta<typeof AvailabilityScreen>

export default meta

type Story = StoryObj<typeof meta>

function renderAvailabilityScreen(args: Story['args']) {
  return (
    <StorybookAppFrame>
      <AvailabilityScreen {...args} />
    </StorybookAppFrame>
  )
}

export const ReadOnly: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  render: renderAvailabilityScreen,
}

export const BookingEnabled: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    settings: BOOKING_ENABLED_SETTINGS,
  },
  render: renderAvailabilityScreen,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Add more' })).toBeNull()
  },
}

export const AvailabilityError: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    laguuni: createStorybookLaguuniParameters('availability-error'),
    settings: BOOKING_ENABLED_SETTINGS,
  },
  render: renderAvailabilityScreen,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await expect(page.findByRole('alert')).resolves.toHaveTextContent(
      'Availability unavailable',
    )
  },
}

export const AvailabilityLoading: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    laguuni: createStorybookLaguuniParameters('availability-loading'),
    settings: BOOKING_ENABLED_SETTINGS,
  },
  render: renderAvailabilityScreen,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await expect(page.findAllByRole('table')).resolves.toHaveLength(2)
    await expect(page.queryByText(/loading|refreshing/i)).toBeNull()
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'

import { BOOKING_ENABLED_SETTINGS, noop } from '@/storybook/fixture-data'

import { AvailabilityCableSelector } from './AvailabilityCableSelector'

const meta = {
  component: AvailabilityCableSelector,
  parameters: {
    settings: BOOKING_ENABLED_SETTINGS,
  },
  title: 'Availability/CableSelector',
} satisfies Meta<typeof AvailabilityCableSelector>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedEasy: Story = {
  args: {
    onSelectCable: noop,
    selectedCable: 'easy',
  },
}

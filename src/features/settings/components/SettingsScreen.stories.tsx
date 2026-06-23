import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  BOOKING_ENABLED_SETTINGS,
  DEVELOPER_MODE_SETTINGS,
  noop,
} from '$storybook/fixture-data'
import { SettingsScreen } from './SettingsScreen'

const meta = {
  component: SettingsScreen,
  parameters: {
    layout: 'fullscreen',
    settings: BOOKING_ENABLED_SETTINGS,
  },
  title: 'Settings/SettingsScreen',
} satisfies Meta<typeof SettingsScreen>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onOpenChange: noop,
    open: true,
  },
}

export const Recovery: Story = {
  args: {
    onOpenChange: noop,
    open: true,
  },
  parameters: {
    seedCorruptedSettings: true,
  },
}

export const DeveloperMode: Story = {
  args: {
    onOpenChange: noop,
    open: true,
  },
  parameters: {
    developerMode: true,
    settings: DEVELOPER_MODE_SETTINGS,
  },
}

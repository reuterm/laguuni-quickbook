import type { Meta, StoryObj } from '@storybook/react-vite'
import { BOOKING_ENABLED_SETTINGS } from '$storybook/fixture-data'
import { StorybookAppFrame } from '../../.storybook/StorybookAppFrame'
import App from './App'

const meta = {
  component: App,
  parameters: {
    layout: 'fullscreen',
    settings: BOOKING_ENABLED_SETTINGS,
  },
  title: 'App/App',
} satisfies Meta<typeof App>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <StorybookAppFrame>
      <App />
    </StorybookAppFrame>
  ),
}

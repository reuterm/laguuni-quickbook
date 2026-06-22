import type { Meta, StoryObj } from '@storybook/react-vite'
import { BOOKING_ENABLED_SETTINGS } from '../storybook/fixtures'
import App from './App'
import { createStorybookLaguuniHandlers } from '../../.storybook/laguuni-handlers'

const storybookLaguuniHandlers = createStorybookLaguuniHandlers()

const meta = {
  component: App,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storybookLaguuniHandlers,
    },
    settings: BOOKING_ENABLED_SETTINGS,
  },
  title: 'App/App',
} satisfies Meta<typeof App>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

import type { Meta, StoryObj } from '@storybook/react'

import App from './App'
import { BOOKING_ENABLED_SETTINGS } from '../storybook/fixtures'
import { createLaguuniHandlers } from '../../tests/msw/handlers/laguuni'

const storybookLaguuniHandlers = createLaguuniHandlers(
  'https://shop.laguuniin.fi',
)

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

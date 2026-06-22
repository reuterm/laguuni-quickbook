import type { Meta, StoryObj } from '@storybook/react'

import { AlertTitle } from './alert-title'

const meta = {
  component: AlertTitle,
  title: 'UI/AlertTitle',
} satisfies Meta<typeof AlertTitle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Saved settings were reset',
  },
}

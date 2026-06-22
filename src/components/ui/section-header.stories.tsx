import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'
import { SectionHeader } from './section-header'

const meta = {
  component: SectionHeader,
  title: 'UI/SectionHeader',
} satisfies Meta<typeof SectionHeader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    description: 'The compact header pattern used throughout the app.',
    eyebrow: 'Availability',
    title: 'Book a one-hour cable slot',
  },
}

export const Actions: Story = {
  args: {
    actions: <Button variant="outline">Refresh</Button>,
    description: 'The compact header pattern used throughout the app.',
    eyebrow: 'Availability',
    title: 'Book a one-hour cable slot',
  },
}

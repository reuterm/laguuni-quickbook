import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { SectionHeader } from './section-header'

type SectionHeaderStoryArgs = {
  description: string
  eyebrow: string
  showActions: boolean
  title: string
}

const meta = {
  argTypes: {
    actions: {
      control: false,
    },
    showActions: {
      control: 'boolean',
    },
  },
  component: SectionHeader,
  title: 'UI/SectionHeader',
} satisfies Meta<SectionHeaderStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    description: 'The compact header pattern used throughout the app.',
    eyebrow: 'Availability',
    showActions: false,
    title: 'Book a one-hour cable slot',
  },
  render: ({ showActions, ...args }) => (
    <SectionHeader
      {...args}
      actions={
        showActions ? <Button variant="outline">Refresh</Button> : undefined
      }
    />
  ),
}

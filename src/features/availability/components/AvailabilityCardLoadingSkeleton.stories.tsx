import type { Meta, StoryObj } from '@storybook/react-vite'

import { AvailabilityCardLoadingSkeleton } from './AvailabilityCardLoadingSkeleton'

const meta = {
  component: AvailabilityCardLoadingSkeleton,
  title: 'Availability/CardLoadingSkeleton',
} satisfies Meta<typeof AvailabilityCardLoadingSkeleton>

export default meta

type Story = StoryObj<typeof meta>

export const FullRange: Story = {
  args: {
    skeletonCount: 3,
  },
}

export const SingleGroup: Story = {
  args: {
    skeletonCount: 1,
  },
}

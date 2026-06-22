import type { Meta, StoryObj } from '@storybook/react'

import { Skeleton } from './skeleton'

const meta = {
  component: Skeleton,
  title: 'UI/Skeleton',
} satisfies Meta<typeof Skeleton>

export default meta

type Story = StoryObj<typeof meta>

export const CardRow: Story = {
  args: {
    className: 'h-18 w-full rounded-xl',
  },
}

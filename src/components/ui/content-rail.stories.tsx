import type { Meta, StoryObj } from '@storybook/react-vite'

import { ContentRail } from './content-rail'

const meta = {
  component: ContentRail,
  title: 'UI/ContentRail',
} satisfies Meta<typeof ContentRail>

export default meta

type Story = StoryObj<typeof meta>

export const Narrow: Story = {
  args: {
    children: 'Centered narrow content rail',
  },
}

export const Page: Story = {
  args: {
    children: 'Centered page-width content rail',
    size: 'page',
  },
}

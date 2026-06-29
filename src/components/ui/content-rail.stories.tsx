import type { Meta, StoryObj } from '@storybook/react-vite'

import { ContentRail } from './content-rail'

const meta = {
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['narrow', 'page'],
    },
  },
  component: ContentRail,
  title: 'UI/ContentRail',
} satisfies Meta<typeof ContentRail>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Centered narrow content rail',
    size: 'narrow',
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'

const meta = {
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: [
        'default',
        'outline',
        'secondary',
        'ghost',
        'link',
        'destructive',
      ],
    },
  },
  component: Button,
  title: 'UI/Button',
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Primary action',
    disabled: false,
    variant: 'default',
  },
}

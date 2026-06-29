import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'

const meta = {
  component: Input,
  title: 'UI/Input',
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    disabled: false,
    defaultValue: 'Test User',
    placeholder: 'Test User',
  },
}

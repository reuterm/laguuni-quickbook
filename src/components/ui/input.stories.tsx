import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './input'

const meta = {
  component: Input,
  title: 'UI/Input',
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: 'Test User',
    placeholder: 'Test User',
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: 'Read only',
    disabled: true,
  },
}

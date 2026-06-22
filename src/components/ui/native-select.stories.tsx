import type { Meta, StoryObj } from '@storybook/react'

import { NativeSelect } from './select'

const meta = {
  component: NativeSelect,
  title: 'UI/NativeSelect',
} satisfies Meta<typeof NativeSelect>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: 'easy',
    children: [
      <option key="pro" value="pro">
        Pro
      </option>,
      <option key="easy" value="easy">
        Easy
      </option>,
      <option key="hietsu" value="hietsu">
        Hietsu
      </option>,
    ],
  },
}

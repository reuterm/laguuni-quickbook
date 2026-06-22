import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

const meta = {
  component: Select,
  title: 'UI/Select',
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <SelectStory />,
}

function SelectStory() {
  const [value, setValue] = useState('easy')

  return (
    <Select defaultOpen value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Choose a cable" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pro">Pro</SelectItem>
        <SelectItem value="easy">Easy</SelectItem>
        <SelectItem value="hietsu">Hietsu</SelectItem>
      </SelectContent>
    </Select>
  )
}

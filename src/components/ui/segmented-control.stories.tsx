import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { SegmentedControl } from './segmented-control'

type SegmentedControlStoryArgs = {
  disabledLastItem: boolean
}

const meta = {
  argTypes: {
    disabledLastItem: {
      control: 'boolean',
    },
    items: {
      control: false,
    },
    onValueChange: {
      control: false,
    },
    value: {
      control: false,
    },
  },
  component: SegmentedControl,
  title: 'UI/SegmentedControl',
} satisfies Meta<SegmentedControlStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    disabledLastItem: false,
  },
  render: ({ disabledLastItem }) => (
    <SegmentedControlStory disabledLastItem={disabledLastItem} />
  ),
}

function SegmentedControlStory({
  disabledLastItem = false,
}: {
  disabledLastItem?: boolean
}) {
  const [value, setValue] = useState<'cards' | 'calendar'>('cards')

  return (
    <SegmentedControl
      ariaLabel="Availability view"
      items={[
        { label: 'Auto', value: 'cards' },
        {
          disabled: disabledLastItem,
          label: 'Calendar only',
          value: 'calendar',
        },
      ]}
      onValueChange={setValue}
      value={value}
    />
  )
}

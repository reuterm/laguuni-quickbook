import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { SegmentedControl } from './segmented-control'

const meta = {
  component: SegmentedControl,
  title: 'UI/SegmentedControl',
} satisfies Meta<typeof SegmentedControl>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <SegmentedControlStory />,
}

export const DisabledOption: Story = {
  render: () => <SegmentedControlStory disabledLastItem />,
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
        { disabled: disabledLastItem, label: 'Calendar only', value: 'calendar' },
      ]}
      onValueChange={setValue}
      value={value}
    />
  )
}

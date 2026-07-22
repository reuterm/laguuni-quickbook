import type { Meta, StoryObj } from '@storybook/react-vite'

import { createAvailabilitySlot, noop } from '$storybook/fixture-data'

import { AvailabilityCapacityChip } from './availability-badge'

type CapacityStoryArgs = {
  capacityState: 'high' | 'medium' | 'low'
  disabled?: boolean
  interactive: boolean
  onClick?: () => void
}

const meta = {
  argTypes: {
    capacityState: {
      control: 'inline-radio',
      options: ['high', 'medium', 'low'],
    },
    slot: {
      control: false,
    },
  },
  component: AvailabilityCapacityChip,
  title: 'Availability/CapacityChip',
} satisfies Meta<CapacityStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

const slotByCapacityState = {
  high: createAvailabilitySlot({ freeCapacity: 4, totalCapacity: 4 }),
  low: createAvailabilitySlot({ freeCapacity: 1, totalCapacity: 4 }),
  medium: createAvailabilitySlot({ freeCapacity: 2, totalCapacity: 4 }),
} as const

function renderCapacityChip({
  capacityState,
  disabled,
  interactive,
  onClick,
}: CapacityStoryArgs) {
  const slot = slotByCapacityState[capacityState]

  if (interactive) {
    return (
      <AvailabilityCapacityChip
        disabled={disabled ?? false}
        onClick={onClick ?? noop}
        pressed={false}
        slot={slot}
      />
    )
  }

  return (
    <AvailabilityCapacityChip disabled={false} pressed={false} slot={slot} />
  )
}

export const Default: Story = {
  args: {
    capacityState: 'high',
    interactive: false,
  },
  render: renderCapacityChip,
}

export const Interactive: Story = {
  args: {
    capacityState: 'low',
    interactive: true,
    onClick: noop,
  },
  render: renderCapacityChip,
}

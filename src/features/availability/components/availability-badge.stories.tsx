import type { Meta, StoryObj } from '@storybook/react'

import { createAvailabilitySlot, noop } from '@/storybook/fixtures'

import { AvailabilityCapacityChip } from './availability-badge'

const meta = {
  component: AvailabilityCapacityChip,
  title: 'Availability/CapacityChip',
} satisfies Meta<typeof AvailabilityCapacityChip>

export default meta

type Story = StoryObj<typeof meta>

export const High: Story = {
  args: {
    slot: createAvailabilitySlot({ freeCapacity: 4, totalCapacity: 4 }),
  },
}

export const Medium: Story = {
  args: {
    slot: createAvailabilitySlot({ freeCapacity: 2, totalCapacity: 4 }),
  },
}

export const Low: Story = {
  args: {
    slot: createAvailabilitySlot({ freeCapacity: 1, totalCapacity: 4 }),
  },
}

export const Interactive: Story = {
  args: {
    onClick: noop,
    slot: createAvailabilitySlot({ freeCapacity: 1, totalCapacity: 4 }),
  },
}

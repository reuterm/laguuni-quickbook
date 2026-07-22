import type { Meta, StoryObj } from '@storybook/react-vite'

import { createAvailabilitySlot } from '$storybook/fixture-data'
import { AvailabilityCalendarTableFrame } from './AvailabilityCalendarTableFrame'
import { AvailabilityCapacityChip } from './availability-badge'

const meta = {
  component: AvailabilityCalendarTableFrame,
  title: 'Availability/CalendarTableFrame',
} satisfies Meta<typeof AvailabilityCalendarTableFrame>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AvailabilityCalendarTableFrame
      label="11 May - 17 May"
      dayHeaders={[
        <th key="thu" scope="col" className="px-3 py-3 text-center">
          Thu 14 May
        </th>,
        <th key="fri" scope="col" className="px-3 py-3 text-center">
          Fri 15 May
        </th>,
      ]}
      body={[
        <tr key="15:00">
          <th scope="row" className="px-3 py-2 text-center">
            15:00
          </th>
          <td className="px-2 py-2 text-center">
            <AvailabilityCapacityChip
              disabled={false}
              pressed={false}
              slot={createAvailabilitySlot({ freeCapacity: 3 })}
            />
          </td>
          <td className="px-2 py-2 text-center">
            <AvailabilityCapacityChip
              disabled={false}
              pressed={false}
              slot={createAvailabilitySlot({ freeCapacity: 2 })}
            />
          </td>
        </tr>,
      ]}
    />
  ),
}

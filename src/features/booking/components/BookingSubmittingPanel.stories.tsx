import type { Meta, StoryObj } from '@storybook/react-vite'

import { BookingSubmittingPanel } from './BookingSubmittingPanel'

const meta = {
  component: BookingSubmittingPanel,
  title: 'Booking/SubmittingPanel',
} satisfies Meta<typeof BookingSubmittingPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selectionsCount: 1,
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'

import { noopAsync } from '@/storybook/fixtures'

import { BookingConfirmPanel } from './BookingConfirmPanel'

const meta = {
  component: BookingConfirmPanel,
  title: 'Booking/ConfirmPanel',
} satisfies Meta<typeof BookingConfirmPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onConfirm: noopAsync,
  },
}

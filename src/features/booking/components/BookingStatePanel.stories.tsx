import type { Meta, StoryObj } from '@storybook/react'

import {
  BookingStatePanel,
  bookingNeutralToneClassName,
} from './BookingStatePanel'

const meta = {
  component: BookingStatePanel,
  title: 'Booking/StatePanel',
} satisfies Meta<typeof BookingStatePanel>

export default meta

type Story = StoryObj<typeof meta>

export const Neutral: Story = {
  args: {
    body: 'Ready to place this booking?',
    title: 'Confirm booking',
    toneClassName: bookingNeutralToneClassName,
  },
}

import type { Meta, StoryObj } from '@storybook/react'

import { createSelection, noop, noopAsync } from '@/storybook/fixtures'

import { getBookingSelectionPresentation } from '../booking-selection-label'
import { BookingConfirmPanel } from './BookingConfirmPanel'
import { BookingSheet } from './BookingSheet'

const meta = {
  component: BookingSheet,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Booking/Sheet',
} satisfies Meta<typeof BookingSheet>

export default meta

type Story = StoryObj<typeof meta>

export const Confirm: Story = {
  args: {
    children: <BookingConfirmPanel onConfirm={noopAsync} />,
    dismissible: true,
    onDismiss: noop,
    summary: getBookingSelectionPresentation(createSelection()),
  },
}

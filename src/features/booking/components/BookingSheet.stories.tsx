import type { Meta, StoryObj } from '@storybook/react-vite'

import { createSelection, noop, noopAsync } from '$storybook/fixture-data'

import { getBookingSelectionsPresentation } from '../booking-selections'
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
    open: true,
    summary: getBookingSelectionsPresentation([createSelection()]),
  },
}

export const LongReview: Story = {
  args: {
    children: <BookingConfirmPanel onConfirm={noopAsync} />,
    dismissible: true,
    onDismiss: noop,
    open: true,
    summary: getBookingSelectionsPresentation(
      Array.from({ length: 16 }, (_, index) =>
        createSelection({
          date: `2026-05-${String(index + 1).padStart(2, '0')}`,
          endTime: '16:00',
          startTime: '15:00',
        }),
      ),
    ),
  },
}

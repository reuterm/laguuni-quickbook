import type { Meta, StoryObj } from '@storybook/react-vite'

import { createSelection } from '@/storybook/fixture-data'

import { getBookingSelectionPresentation } from '../booking-selection-label'
import { BookingSubmittingPanel } from './BookingSubmittingPanel'

const meta = {
  component: BookingSubmittingPanel,
  title: 'Booking/SubmittingPanel',
} satisfies Meta<typeof BookingSubmittingPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selectionLabel: getBookingSelectionPresentation(createSelection()).label,
  },
}

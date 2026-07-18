import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  createBookingResult,
  createSelection,
  noopAsync,
} from '$storybook/fixture-data'

import { getBookingSelectionPresentation } from '../booking-selection-label'
import { BookingResultPanel } from './BookingResultPanel'

const selectionLabel = getBookingSelectionPresentation(createSelection()).label

const meta = {
  component: BookingResultPanel,
  title: 'Booking/ResultPanel',
} satisfies Meta<typeof BookingResultPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    onAddToCalendar: noopAsync,
    onExportTrace: noopAsync,
    result: createBookingResult('success'),
    selectionLabel,
    traceId: 'trace-success',
  },
}

export const PaymentRequired: Story = {
  args: {
    onAddToCalendar: noopAsync,
    onExportTrace: noopAsync,
    result: createBookingResult('payment_required'),
    selectionLabel,
    traceId: 'trace-payment',
  },
}

export const Failed: Story = {
  args: {
    onAddToCalendar: noopAsync,
    onExportTrace: noopAsync,
    result: createBookingResult('failed'),
    selectionLabel,
    traceId: 'trace-failed',
  },
}

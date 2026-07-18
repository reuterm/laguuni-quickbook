import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  createBookingSheetState,
  createCompletedBookingSheetState,
  noop,
  noopAsync,
} from '$storybook/fixture-data'

import { BookingSheetFlow } from './BookingSheetFlow'

const meta = {
  component: BookingSheetFlow,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Booking/SheetFlow',
} satisfies Meta<typeof BookingSheetFlow>

export default meta

type Story = StoryObj<typeof meta>

export const Confirm: Story = {
  args: {
    bookingSheetState: createBookingSheetState('confirm'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const Submitting: Story = {
  args: {
    bookingSheetState: createBookingSheetState('submitting'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const Completed: Story = {
  args: {
    bookingSheetState: createCompletedBookingSheetState('failed'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const CompletedSuccessfulBooking: Story = {
  args: {
    bookingSheetState: createCompletedBookingSheetState('success'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const CompletedPaymentRequired: Story = {
  args: {
    bookingSheetState: createCompletedBookingSheetState('payment_required'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

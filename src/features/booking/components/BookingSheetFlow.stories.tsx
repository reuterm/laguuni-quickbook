import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import {
  createBookingSheetState,
  createCompletedBookingSheetState,
  createSelection,
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
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Booking in progress' }),
    ).toBeVisible()
  },
}

const multiSlotSelections = [
  createSelection({ date: '2026-05-20', endTime: '16:00', startTime: '15:00' }),
  createSelection({
    cableId: 'easy',
    date: '2026-05-21',
    endTime: '11:00',
    startTime: '10:00',
  }),
] as const

export const MultiSlotReview: Story = {
  args: {
    bookingSheetState: {
      kind: 'basket',
      selections: multiSlotSelections,
      status: 'confirm',
    },
    clearBookingSelection: fn(),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const CompletedSuccessfulMultiSlotBooking: Story = {
  args: {
    bookingSheetState: {
      result: {
        orderIdentifier: 'fixture-multi-slot-order-id',
        status: 'success',
      },
      selections: multiSlotSelections,
      status: 'completed',
      traceId: 'trace-multi-slot-success',
    },
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

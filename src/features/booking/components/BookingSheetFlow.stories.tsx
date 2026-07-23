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

const noContinuationActions = {
  basket: { onClearSelection: noop },
  initial: { continuation: 'none' as const },
}

export const Confirm: Story = {
  args: {
    actions: noContinuationActions,
    bookingSheetState: createBookingSheetState('confirm'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const LongReview: Story = {
  name: 'Long review',
  args: {
    actions: noContinuationActions,
    bookingSheetState: {
      kind: 'initial',
      selections: Array.from({ length: 16 }, (_, index) =>
        createSelection({
          date: `2026-05-${String(index + 1).padStart(2, '0')}`,
          endTime: '16:00',
          startTime: '15:00',
        }),
      ),
      status: 'confirm',
    },
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const InitialConfirmation: Story = {
  args: {
    actions: {
      basket: { onClearSelection: noop },
      initial: { continuation: 'add-more', onAddMore: fn() },
    },
    bookingSheetState: {
      kind: 'initial',
      selections: [createSelection()],
      status: 'confirm',
    },
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
  play: async ({ args, canvas }) => {
    await canvas.getByRole('button', { name: 'Add more' }).click()
    if (args.actions.initial.continuation !== 'add-more') {
      throw new Error('Expected the Add more continuation action.')
    }
    await expect(args.actions.initial.onAddMore).toHaveBeenCalledOnce()
  },
}

export const Submitting: Story = {
  args: {
    actions: noContinuationActions,
    bookingSheetState: createBookingSheetState('submitting'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const CompletedFailed: Story = {
  name: 'Failed',
  args: {
    actions: noContinuationActions,
    bookingSheetState: createCompletedBookingSheetState('failed'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const CompletedSuccessfulBooking: Story = {
  args: {
    actions: noContinuationActions,
    bookingSheetState: createCompletedBookingSheetState('success'),
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
}

export const CompletedPaymentRequired: Story = {
  args: {
    actions: noContinuationActions,
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

export const MixedCableBasketReview: Story = {
  args: {
    actions: { ...noContinuationActions, basket: { onClearSelection: fn() } },
    bookingSheetState: {
      kind: 'basket',
      selections: multiSlotSelections,
      status: 'confirm',
    },
    confirmBooking: noopAsync,
    dismissBookingSheet: noop,
    onExportTrace: noopAsync,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2 slots')).toBeVisible()
    await expect(canvas.getByText('Pro')).toBeVisible()
    await expect(canvas.getByText('Easy')).toBeVisible()
  },
}

export const CompletedSuccessfulMultiSlotBooking: Story = {
  args: {
    actions: noContinuationActions,
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

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { BOOKING_ENABLED_SETTINGS, noop } from '@/storybook/fixtures'
import { createStorybookLaguuniHandlers } from '../../../../.storybook/laguuni-handlers'

import { AvailabilityScreen } from './AvailabilityScreen'

const storybookLaguuniHandlers =
  createStorybookLaguuniHandlers('booking-enabled')
const paymentRequiredHandlers =
  createStorybookLaguuniHandlers('payment-required')
const failedBookingHandlers = createStorybookLaguuniHandlers('failed-booking')
const successfulBookingSettings = {
  ...BOOKING_ENABLED_SETTINGS,
  seasonPassCode: 'FIXTURE-DISCOUNT',
}

const meta = {
  component: AvailabilityScreen,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: storybookLaguuniHandlers,
    },
  },
  title: 'Availability/Screen',
} satisfies Meta<typeof AvailabilityScreen>

export default meta

type Story = StoryObj<typeof meta>

export const ReadOnly: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
}

export const BookingEnabled: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    settings: BOOKING_ENABLED_SETTINGS,
  },
}

export const PaymentRequired: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    msw: {
      handlers: paymentRequiredHandlers,
    },
    settings: BOOKING_ENABLED_SETTINGS,
  },
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(getFirstBookButton(canvas))
    await userEvent.click(page.getByRole('button', { name: 'Confirm booking' }))

    await expect(
      page.findByRole('heading', { name: 'Payment required' }),
    ).resolves.toBeInTheDocument()
    await expect(
      page.findByRole('link', { name: 'Continue to payment' }),
    ).resolves.toHaveAttribute('href', 'https://example.com/mobilepay')
  },
}

export const FailedBooking: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    msw: {
      handlers: failedBookingHandlers,
    },
    settings: BOOKING_ENABLED_SETTINGS,
  },
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(getFirstBookButton(canvas))
    await userEvent.click(page.getByRole('button', { name: 'Confirm booking' }))

    await expect(
      page.findByRole('heading', { name: 'Booking failed' }),
    ).resolves.toBeInTheDocument()
    await expect(
      page.findByRole('button', { name: 'Copy diagnostics' }),
    ).resolves.toBeInTheDocument()
  },
}

export const SuccessfulBooking: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    settings: successfulBookingSettings,
  },
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(getFirstBookButton(canvas))
    await userEvent.click(page.getByRole('button', { name: 'Confirm booking' }))

    await expect(
      page.findByRole('heading', { name: 'Booking confirmed' }),
    ).resolves.toBeInTheDocument()
  },
}

function getFirstBookButton(
  canvas: Pick<ReturnType<typeof within>, 'getAllByRole'>,
) {
  const firstBookButton = canvas.getAllByRole('button', { name: 'Book' })[0]

  if (firstBookButton === undefined) {
    throw new Error('Expected at least one Book button')
  }

  return firstBookButton
}

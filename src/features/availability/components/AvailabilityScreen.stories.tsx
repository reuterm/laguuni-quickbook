import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { BOOKING_ENABLED_SETTINGS, noop } from '$storybook/fixture-data'
import { createStorybookLaguuniParameters } from '../../../../.storybook/laguuni-handlers'

import { AvailabilityScreen } from './AvailabilityScreen'

const successfulBookingSettings = {
  ...BOOKING_ENABLED_SETTINGS,
  seasonPassCode: 'FIXTURE-DISCOUNT',
}

const meta = {
  component: AvailabilityScreen,
  parameters: {
    layout: 'fullscreen',
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

export const AvailabilityError: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    laguuni: createStorybookLaguuniParameters('availability-error'),
    settings: BOOKING_ENABLED_SETTINGS,
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await expect(page.findByRole('alert')).resolves.toHaveTextContent(
      'Fixture outage',
    )
  },
}

export const AvailabilityLoading: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    laguuni: createStorybookLaguuniParameters('availability-loading'),
    settings: BOOKING_ENABLED_SETTINGS,
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await expect(page.findByText('Loading availability…')).resolves.toBeInTheDocument()
  },
}

export const InvalidSavedCode: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    laguuni: createStorybookLaguuniParameters('invalid-code'),
    settings: {
      ...BOOKING_ENABLED_SETTINGS,
      seasonPassCode: 'INVALID',
    },
  },
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(getFirstBookButton(canvas))
    await userEvent.click(page.getByRole('button', { name: 'Confirm booking' }))

    await expect(
      page.findByRole('heading', { name: 'Booking failed' }),
    ).resolves.toBeInTheDocument()
    await expect(page.findByRole('alert')).resolves.toHaveTextContent(
      'The saved season pass code was not accepted.',
    )
  },
}

export const PaymentRequired: Story = {
  args: {
    isOnline: true,
    onOpenSettings: noop,
  },
  parameters: {
    laguuni: createStorybookLaguuniParameters('payment-required'),
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
    laguuni: createStorybookLaguuniParameters('failed-booking'),
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

import type { Meta, StoryObj } from '@storybook/react'

import { Alert, AlertDescription } from './alert'
import { AlertTitle } from './alert-title'

const meta = {
  component: Alert,
  title: 'UI/Alert',
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Default notice</AlertTitle>
      <AlertDescription>
        Subtle informational surface for non-critical guidance.
      </AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: (args) => (
    <Alert {...args} variant="success">
      <AlertTitle>Saved locally</AlertTitle>
      <AlertDescription>
        Settings remain available on this device for the next booking.
      </AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  render: (args) => (
    <Alert {...args} variant="warning">
      <AlertTitle>Payment still required</AlertTitle>
      <AlertDescription>
        Continue in the storefront flow to finish checkout.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive">
      <AlertTitle>Checkout failed</AlertTitle>
      <AlertDescription>
        The booking could not be completed for this slot.
      </AlertDescription>
    </Alert>
  ),
}

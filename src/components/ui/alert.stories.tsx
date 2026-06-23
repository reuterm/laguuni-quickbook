import type { Meta, StoryObj } from '@storybook/react-vite'

import { Alert, AlertDescription } from './alert'
import { AlertTitle } from './alert-title'

const alertContentByVariant = {
  default: {
    description: 'Subtle informational surface for non-critical guidance.',
    title: 'Default notice',
  },
  destructive: {
    description: 'The booking could not be completed for this slot.',
    title: 'Checkout failed',
  },
  success: {
    description:
      'Settings remain available on this device for the next booking.',
    title: 'Saved locally',
  },
  warning: {
    description: 'Continue in the storefront flow to finish checkout.',
    title: 'Payment still required',
  },
} as const

const meta = {
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'success', 'warning', 'destructive'],
    },
  },
  component: Alert,
  title: 'UI/Alert',
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>
        {alertContentByVariant[args.variant ?? 'default'].title}
      </AlertTitle>
      <AlertDescription>
        {alertContentByVariant[args.variant ?? 'default'].description}
      </AlertDescription>
    </Alert>
  ),
}

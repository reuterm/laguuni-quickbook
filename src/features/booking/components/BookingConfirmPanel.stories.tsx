import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import { noopAsync } from '$storybook/fixture-data'

import { BookingConfirmPanel } from './BookingConfirmPanel'

const meta = {
  component: BookingConfirmPanel,
  title: 'Booking/ConfirmPanel',
} satisfies Meta<typeof BookingConfirmPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onConfirm: noopAsync,
  },
}

export const AddMore: Story = {
  args: {
    onConfirm: fn(),
    secondaryAction: { label: 'Add more', onClick: fn() },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Confirm booking' }),
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Add more' }))

    await expect(args.onConfirm).toHaveBeenCalled()
    await expect(args.secondaryAction.onClick).toHaveBeenCalled()
  },
}

export const ClearSelection: Story = {
  args: {
    onConfirm: noopAsync,
    secondaryAction: { label: 'Clear selection', onClick: fn() },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear selection' }),
    )

    await expect(args.secondaryAction.onClick).toHaveBeenCalled()
  },
}

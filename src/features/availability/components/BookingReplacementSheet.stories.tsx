import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { noop } from '$storybook/fixture-data'
import { localDate } from '../../../../tests/local-date'
import type { PendingBookingReplacement } from '../booking-replacement'
import { BookingReplacementSheet } from './BookingReplacementSheet'

const pendingReplacement: PendingBookingReplacement = {
  current: {
    cableId: 'pro',
    date: localDate('2026-05-14'),
    endTime: '16:00',
    startTime: '15:00',
  },
  proposed: {
    cableId: 'easy',
    date: localDate('2026-05-14'),
    endTime: '18:00',
    startTime: '17:00',
  },
}

function ReplacementSheetStory() {
  return (
    <BookingReplacementSheet
      pendingReplacement={pendingReplacement}
      onKeepCurrentSelection={noop}
      onReplace={noop}
    />
  )
}

const meta = {
  component: BookingReplacementSheet,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Availability/BookingReplacementSheet',
} satisfies Meta<typeof BookingReplacementSheet>

export default meta

type Story = StoryObj<typeof meta>

export const CrossCableReplacement: Story = {
  render: () => <ReplacementSheetStory />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)
    const dialog = page.getByRole('dialog')

    await expect(dialog).toHaveTextContent(/Replace Pro .* with Easy/)

    await expect(
      page.getByRole('button', { name: 'Keep current' }),
    ).toHaveClass('w-full')
    await expect(page.getByRole('button', { name: 'Replace' })).toHaveClass(
      'w-full',
    )

    await userEvent.click(page.getByRole('button', { name: 'Keep current' }))

    await expect(dialog).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Replace' }))

    await expect(dialog).toBeVisible()
  },
}

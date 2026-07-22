import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

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
  const [replacement, setReplacement] =
    useState<PendingBookingReplacement | null>(pendingReplacement)

  return (
    <BookingReplacementSheet
      pendingReplacement={replacement}
      onKeepCurrentSelection={() => setReplacement(null)}
      onReplace={() => setReplacement(null)}
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

    await userEvent.click(page.getByRole('button', { name: 'Keep current' }))

    await waitFor(() => {
      expect(dialog).toHaveAttribute('data-state', 'closed')
    })
  },
}

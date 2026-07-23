import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import type { BookingSlotSelection } from '@/domain/booking'
import { localDate } from '../../../../tests/local-date'
import { BasketReviewAction } from './BasketReviewAction'

const onReview = fn()
const selection: BookingSlotSelection = {
  cableId: 'pro',
  date: localDate('2026-05-14'),
  endTime: '13:00',
  startTime: '12:00',
}

const meta = {
  component: BasketReviewAction,
  title: 'Availability/BasketReviewAction',
} satisfies Meta<typeof BasketReviewAction>

export default meta

type Story = StoryObj<typeof meta>

export const WithSelection: Story = {
  args: { onReview, selections: [selection] },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Review selection' }),
    )
    await expect(onReview).toHaveBeenCalledOnce()
  },
}

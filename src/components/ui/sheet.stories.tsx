import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './sheet'

const meta = {
  component: Sheet,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'UI/Sheet',
} satisfies Meta<typeof Sheet>

export default meta

type Story = StoryObj<typeof meta>

export const RightSide: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="pr-10 text-left">
          <SheetTitle>Booking details</SheetTitle>
          <SheetDescription>
            The app uses sheet surfaces for settings and booking flows.
          </SheetDescription>
        </SheetHeader>
        <Button>Primary action</Button>
      </SheetContent>
    </Sheet>
  ),
}

export const BottomSide: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="bottom" className="rounded-t-[2rem] px-5 pb-7 pt-6 sm:mx-auto sm:max-w-lg">
        <SheetHeader className="pr-10 text-left">
          <SheetTitle>Booking details</SheetTitle>
          <SheetDescription>Bottom sheet presentation used for checkout flow.</SheetDescription>
        </SheetHeader>
        <Button>Confirm booking</Button>
      </SheetContent>
    </Sheet>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { SurfaceList, SurfaceListItem } from './surface-list'

const meta = {
  component: SurfaceList,
  title: 'UI/SurfaceList',
} satisfies Meta<typeof SurfaceList>

export default meta

type Story = StoryObj<typeof meta>

export const Inline: Story = {
  render: () => (
    <SurfaceList>
      <SurfaceListItem layout="inline">
        <div>
          <p className="font-medium text-foreground">Thu 14 May</p>
          <p className="text-sm text-muted-foreground">2 bookable slots</p>
        </div>
        <Button size="sm">Book</Button>
      </SurfaceListItem>
    </SurfaceList>
  ),
}

export const Interactive: Story = {
  render: () => (
    <SurfaceList>
      <SurfaceListItem interactive>
        <div>
          <p className="font-medium text-foreground">Diagnostics trace</p>
          <p className="text-sm text-muted-foreground">
            Tap to inspect a retained booking flow.
          </p>
        </div>
        <Button size="sm" variant="ghost">
          Open
        </Button>
      </SurfaceListItem>
    </SurfaceList>
  ),
}

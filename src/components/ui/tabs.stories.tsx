import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  component: Tabs,
  title: 'UI/Tabs',
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <TabsStory />,
}

function TabsStory() {
  const [tab, setTab] = useState('overview')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-muted-foreground">Primary availability content.</p>
      </TabsContent>
      <TabsContent value="diagnostics">
        <p className="text-sm text-muted-foreground">Secondary diagnostics content.</p>
      </TabsContent>
    </Tabs>
  )
}

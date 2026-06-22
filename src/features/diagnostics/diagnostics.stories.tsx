import type { Meta, StoryObj } from '@storybook/react'

import { DiagnosticsCopyAction } from './DiagnosticsCopyAction'
import { StorySurface, noopAsync } from '../../storybook/fixtures'

const meta = {
  component: DiagnosticsCopyAction,
  parameters: {
    layout: 'padded',
  },
  title: 'Diagnostics/DiagnosticsCopyAction',
} satisfies Meta<typeof DiagnosticsCopyAction>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onCopy: noopAsync,
  },
}

export const Outline: Story = {
  args: {
    buttonContent: 'Export all diagnostics logs',
    buttonVariant: 'outline',
    onCopy: noopAsync,
  },
  render: (args) => (
    <StorySurface>
      <DiagnosticsCopyAction {...args} />
    </StorySurface>
  ),
}

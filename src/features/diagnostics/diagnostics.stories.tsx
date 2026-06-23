import type { Meta, StoryObj } from '@storybook/react-vite'
import { noopAsync } from '../../storybook/fixture-data'
import { StorySurface } from '../../storybook/fixtures'
import { DiagnosticsCopyAction } from './DiagnosticsCopyAction'

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

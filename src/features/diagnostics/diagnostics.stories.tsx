import type { Meta, StoryObj } from '@storybook/react-vite'
import { noopAsync } from '$storybook/fixture-data'
import { StorySurface } from '$storybook/fixtures'
import { DiagnosticsCopyAction } from './DiagnosticsCopyAction'

const meta = {
  argTypes: {
    buttonVariant: {
      control: 'inline-radio',
      options: ['default', 'outline'],
    },
  },
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
    buttonContent: 'Copy diagnostics',
    onCopy: noopAsync,
    buttonVariant: 'default',
  },
  render: (args) => (
    <StorySurface>
      <DiagnosticsCopyAction {...args} />
    </StorySurface>
  ),
}

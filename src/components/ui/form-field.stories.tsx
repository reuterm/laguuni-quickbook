import type { Meta, StoryObj } from '@storybook/react-vite'

import { FormField } from './form-field'
import { Input } from './input'

const meta = {
  component: FormField,
  title: 'UI/FormField',
} satisfies Meta<typeof FormField>

export default meta

type Story = StoryObj<typeof meta>

export const Description: Story = {
  render: (args) => (
    <FormField {...args} label="Name" description="Saved only in this browser.">
      <Input placeholder="Test User" defaultValue="Test User" />
    </FormField>
  ),
}

export const Error: Story = {
  render: (args) => (
    <FormField
      {...args}
      label="Season pass code"
      error="This code was not accepted."
    >
      <Input placeholder="Optional" defaultValue="FIXTURE-CODE" />
    </FormField>
  ),
}

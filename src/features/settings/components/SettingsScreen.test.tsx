import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearPersistedAppState,
  writeCorruptedSettings,
} from '../../../test/persisted-state'
import { renderApp } from '../../../test/render-app'

describe('Settings screen integration', () => {
  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
  })

  it('persists settings locally and restores the saved default cable', async () => {
    const user = userEvent.setup()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Phone'), '+358401234567')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Season pass code'), 'FIXTURE-CODE')
    await user.selectOptions(screen.getByLabelText('Default cable'), 'easy')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved locally on this device.',
    )

    cleanup()

    renderApp()

    expect(screen.getByRole('button', { name: 'Easy' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+358401234567')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('FIXTURE-CODE')).toBeInTheDocument()
    expect(screen.getByLabelText('Default cable')).toHaveValue('easy')
  })

  it('does not override the current cable after changing the saved default in-session', async () => {
    const user = userEvent.setup()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Hietsu' }))
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.selectOptions(screen.getByLabelText('Default cable'), 'easy')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    await user.click(screen.getByRole('button', { name: 'Availability' }))

    expect(screen.getByRole('button', { name: 'Hietsu' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Easy' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('surfaces when corrupted local settings were reset to safe defaults', async () => {
    const user = userEvent.setup()

    writeCorruptedSettings()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Previously saved settings could not be read and were reset to safe defaults on this device.',
    )
    expect(screen.getByLabelText('Default cable')).toHaveValue('')
  })
})

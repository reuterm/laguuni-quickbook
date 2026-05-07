import { cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPersistedAppState,
  enableDeveloperMode,
  writeCorruptedSettings,
} from '../../../test/persisted-state'
import { renderApp } from '../../../test/render-app'

describe('Settings screen integration', () => {
  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists settings locally and restores the saved default cable', async () => {
    const user = userEvent.setup()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    setInputValue('Name', 'Test User')
    setInputValue('Phone', '+358401234567')
    setInputValue('Email', 'test@example.com')
    setInputValue('Season pass code', 'FIXTURE-CODE')
    await user.selectOptions(screen.getByLabelText('Default cable'), 'easy')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(
      screen.queryByRole('button', { name: 'Save settings' }),
    ).not.toBeInTheDocument()

    cleanup()

    renderApp()

    expect(screen.getByRole('tab', { name: 'Easy' })).toHaveAttribute(
      'aria-selected',
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
    await user.click(screen.getByRole('tab', { name: 'Easy' }))
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.selectOptions(screen.getByLabelText('Default cable'), 'pro')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(screen.getByRole('tab', { name: 'Easy' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Pro' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('discards unsaved edits when the sheet closes', async () => {
    const user = userEvent.setup()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.type(screen.getByLabelText('Name'), 'Unsaved draft')
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByLabelText('Name')).toHaveValue('')
  })

  it('surfaces when corrupted local settings were reset to safe defaults', async () => {
    const user = userEvent.setup()

    writeCorruptedSettings()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Previously saved settings could not be read and were reset to safe defaults on this device.',
    )
    expect(screen.getByLabelText('Default cable')).toHaveValue('__none__')
  })

  it('exports all retained diagnostics logs from settings', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})

    enableDeveloperMode()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    })

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByText('Developer tools')).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Export all diagnostics logs' }),
    )

    expect(
      await screen.findByText('Diagnostics copied to the clipboard.'),
    ).toBeVisible()
    expect(writeText).toHaveBeenCalledOnce()
    const firstClipboardCall = writeText.mock.calls.at(0)

    expect(firstClipboardCall).toBeDefined()

    const copiedDiagnostics = firstClipboardCall?.at(0)

    expect(typeof copiedDiagnostics).toBe('string')

    if (typeof copiedDiagnostics !== 'string') {
      throw new Error('Expected diagnostics to be copied as text')
    }

    expect(JSON.parse(copiedDiagnostics)).toEqual({
      entries: [],
      recoveryIssue: null,
    })
  })

  it('keeps developer tools hidden until developer mode is enabled', async () => {
    const user = userEvent.setup()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.queryByText('Developer tools')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Export all diagnostics logs' }),
    ).not.toBeInTheDocument()

    const versionButton = screen.getByRole('button', {
      name: 'App version test-version',
    })

    for (let index = 0; index < 6; index += 1) {
      await user.click(versionButton)
    }

    expect(screen.queryByText('Developer tools')).not.toBeInTheDocument()

    await user.click(versionButton)

    expect(screen.getByText('Developer tools')).toBeVisible()
  })

  it('persists developer mode until it is disabled', async () => {
    const user = userEvent.setup()

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    const versionButton = screen.getByRole('button', {
      name: 'App version test-version',
    })

    for (let index = 0; index < 7; index += 1) {
      await user.click(versionButton)
    }

    expect(screen.getByText('Developer tools')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByText('Developer tools')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Disable developer mode' }),
    )

    expect(screen.queryByText('Developer tools')).not.toBeInTheDocument()
  })

  it('clears retained diagnostics logs from developer tools', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})

    enableDeveloperMode()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    })

    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))

    await user.click(
      screen.getByRole('button', { name: 'Clear diagnostics log' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Export all diagnostics logs' }),
    )

    const firstClipboardCall = writeText.mock.calls.at(0)

    expect(firstClipboardCall).toBeDefined()

    const copiedDiagnostics = firstClipboardCall?.at(0)

    expect(typeof copiedDiagnostics).toBe('string')

    if (typeof copiedDiagnostics !== 'string') {
      throw new Error('Expected diagnostics to be copied as text')
    }

    expect(JSON.parse(copiedDiagnostics)).toEqual({
      entries: [],
      recoveryIssue: null,
    })
  })
})

function setInputValue(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  })
}

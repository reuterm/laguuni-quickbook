import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import { DIAGNOSTICS_STORAGE_KEY } from './logs'
import {
  AppDiagnosticsBoundary,
  DiagnosticsRuntimeCapture,
} from './runtime-capture'

describe('diagnostics runtime capture', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.removeItem(DIAGNOSTICS_STORAGE_KEY)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.localStorage.removeItem(DIAGNOSTICS_STORAGE_KEY)
  })

  it('renders a fallback and records diagnostics when a component crashes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    vi.stubGlobal('location', {
      ...window.location,
      reload,
    })

    render(
      <TestDiagnosticsProvider>
        <AppDiagnosticsBoundary>
          <CrashingComponent />
        </AppDiagnosticsBoundary>
      </TestDiagnosticsProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Unexpected app error' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Trace ID:/)).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Copy diagnostics' }))

    expect(
      await screen.findByText('Diagnostics copied to the clipboard.'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Reload page' }))

    const storedDiagnostics = window.localStorage.getItem(
      DIAGNOSTICS_STORAGE_KEY,
    )

    expect(storedDiagnostics).toContain('app.render_error')
    expect(storedDiagnostics).toContain('Crash during render')
    expect(storedDiagnostics).toContain('traceId')
    expect(reload).toHaveBeenCalledOnce()
  })

  it('records window errors without surfacing a crash fallback', async () => {
    render(
      <TestDiagnosticsProvider>
        <DiagnosticsRuntimeCapture />
        <div>Diagnostics runtime active</div>
      </TestDiagnosticsProvider>,
    )

    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('Background runtime error'),
        filename: 'https://example.test/app.js',
        lineno: 42,
        message: 'Background runtime error',
      }),
    )

    await waitFor(() => {
      const storedDiagnostics = window.localStorage.getItem(
        DIAGNOSTICS_STORAGE_KEY,
      )

      expect(storedDiagnostics).toContain('app.window_error')
      expect(storedDiagnostics).toContain('Background runtime error')
      expect(storedDiagnostics).toContain('https://example.test/app.js')
    })

    expect(screen.getByText('Diagnostics runtime active')).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Unexpected app error' }),
    ).not.toBeInTheDocument()
  })

  it('records unhandled promise rejections without surfacing a crash fallback', async () => {
    render(
      <TestDiagnosticsProvider>
        <DiagnosticsRuntimeCapture />
        <div>Diagnostics runtime active</div>
      </TestDiagnosticsProvider>,
    )

    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: new Error('Unhandled background failure'),
      }),
    )

    await waitFor(() => {
      const storedDiagnostics = window.localStorage.getItem(
        DIAGNOSTICS_STORAGE_KEY,
      )

      expect(storedDiagnostics).toContain('app.unhandled_rejection')
      expect(storedDiagnostics).toContain('Unhandled background failure')
    })

    expect(screen.getByText('Diagnostics runtime active')).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Unexpected app error' }),
    ).not.toBeInTheDocument()
  })
})

function CrashingComponent(): ReactElement {
  throw new Error('Crash during render')
}

function TestDiagnosticsProvider({ children }: { children: ReactNode }) {
  return (
    <AppProviders
      apiBaseUrl="https://shop.laguuniin.fi"
      appVersion="test-version"
      storage={window.localStorage}
    >
      {children}
    </AppProviders>
  )
}

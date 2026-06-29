import { cleanup, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { READ_ONLY_NOTICE_STORAGE_KEY } from '../features/availability/read-only-notice-storage'
import { createMemoryStorage } from './create-memory-storage'
import { clearPersistedAppState } from './persisted-state'
import { renderApp } from './render-app'

describe('renderApp', () => {
  beforeEach(() => {
    cleanup()
    clearPersistedAppState()
  })

  it('uses the supplied storage instead of window.localStorage', async () => {
    window.localStorage.setItem(READ_ONLY_NOTICE_STORAGE_KEY, 'true')

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      storage: createMemoryStorage(),
    })

    expect(
      await screen.findByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).toBeInTheDocument()
  })

  it('uses a supplied fetch implementation override', async () => {
    const fetchImplementation: typeof fetch = vi.fn(globalThis.fetch)

    renderApp({
      availabilityReferenceDate: new Date('2026-05-20T12:00:00'),
      fetchImplementation,
      storage: createMemoryStorage(),
    })

    expect(
      await screen.findByText(
        /Save your name, phone, and email in Settings to reveal booking actions\./,
      ),
    ).toBeInTheDocument()
    expect(fetchImplementation).toHaveBeenCalled()
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { READ_ONLY_NOTICE_STORAGE_KEY } from '../features/availability/read-only-notice-storage'
import { DIAGNOSTICS_STORAGE_KEY } from '../features/diagnostics/logs'
import { loadDeveloperModeEnabled } from '../features/settings/developer-mode-storage'
import {
  UserSettingsProvider,
  useUserSettings,
} from '../features/settings/use-user-settings'
import { SETTINGS_STORAGE_KEY } from '../lib/storage/local-storage'
import { createMemoryStorage } from '../test/create-memory-storage'
import {
  AppProviders,
  useBrowserStorage,
  useDiagnostics,
  useReadOnlyNoticeStore,
} from './providers'

describe('AppProviders', () => {
  const fetchImplementation = globalThis.fetch.bind(globalThis)

  afterEach(() => {
    window.localStorage.clear()
  })

  it('loads user settings from injected storage instead of window.localStorage', () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        email: 'window@example.com',
        name: 'Window User',
        phone: '',
        seasonPassCode: '',
        defaultCable: null,
        version: 1,
      }),
    )

    const storage = createMemoryStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        availabilityView: 'calendar',
        email: 'injected@example.com',
        name: 'Injected User',
        phone: '',
        seasonPassCode: '',
        defaultCable: null,
        version: 1,
      }),
    })

    render(
      <AppProviders
        apiBaseUrl="https://shop.laguuniin.fi"
        appVersion="test-version"
        fetchImplementation={fetchImplementation}
        storage={storage}
      >
        <UserSettingsProvider>
          <UserSettingsProbe />
        </UserSettingsProvider>
      </AppProviders>,
    )

    expect(screen.getByText('Injected User')).toBeVisible()
    expect(screen.getByText('injected@example.com')).toBeVisible()
    expect(screen.queryByText('Window User')).not.toBeInTheDocument()
  })

  it('writes diagnostics to injected storage instead of window.localStorage', async () => {
    const storage = createMemoryStorage()

    render(
      <AppProviders
        apiBaseUrl="https://shop.laguuniin.fi"
        appVersion="test-version"
        fetchImplementation={fetchImplementation}
        storage={storage}
      >
        <DiagnosticsProbe />
      </AppProviders>,
    )

    await waitFor(() => {
      expect(storage.getItem(DIAGNOSTICS_STORAGE_KEY)).not.toBeNull()
    })
    expect(storage.getItem(DIAGNOSTICS_STORAGE_KEY)).toContain(
      'injected.storage',
    )
    expect(window.localStorage.getItem(DIAGNOSTICS_STORAGE_KEY)).toBeNull()
  })

  it('exposes injected storage to app hooks', () => {
    const storage = createMemoryStorage({
      [READ_ONLY_NOTICE_STORAGE_KEY]: 'true',
    })

    window.localStorage.setItem(READ_ONLY_NOTICE_STORAGE_KEY, 'false')
    window.localStorage.setItem(
      'laguuni.quickbook.settings.developer-mode',
      'false',
    )

    render(
      <AppProviders
        apiBaseUrl="https://shop.laguuniin.fi"
        appVersion="test-version"
        fetchImplementation={fetchImplementation}
        storage={storage}
      >
        <StorageProbe />
      </AppProviders>,
    )

    expect(screen.getByText('developer-mode:false')).toBeVisible()
    expect(screen.getByText('read-only-dismissed:true')).toBeVisible()
  })
})

function UserSettingsProbe() {
  const { settings } = useUserSettings()

  return (
    <>
      <div>{settings.name}</div>
      <div>{settings.email}</div>
    </>
  )
}

function DiagnosticsProbe() {
  const diagnostics = useDiagnostics()

  useEffect(() => {
    diagnostics.beginTrace().append({ event: 'injected.storage' })
  }, [diagnostics])

  return null
}

function StorageProbe() {
  const storage = useBrowserStorage()
  const readOnlyNoticeStore = useReadOnlyNoticeStore()

  return (
    <>
      <div>{`developer-mode:${loadDeveloperModeEnabled(storage)}`}</div>
      <div>{`read-only-dismissed:${readOnlyNoticeStore.isDismissed()}`}</div>
    </>
  )
}

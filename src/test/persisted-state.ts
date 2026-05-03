import { DEFAULT_USER_SETTINGS, type UserSettings } from '../domain/settings'
import {
  DIAGNOSTICS_STORAGE_KEY,
  type DiagnosticsRecoveryIssue,
} from '../features/diagnostics/logs'
import {
  type BrowserStorage,
  LocalSettingsStore,
  SETTINGS_STORAGE_KEY,
} from '../lib/storage/local-storage'

export function clearPersistedAppState(
  storage: BrowserStorage = window.localStorage,
) {
  storage.removeItem(DIAGNOSTICS_STORAGE_KEY)
  storage.removeItem(SETTINGS_STORAGE_KEY)
}

export function saveUserSettings(
  overrides: Partial<UserSettings>,
  storage: BrowserStorage = window.localStorage,
) {
  const settingsStore = new LocalSettingsStore({ storage })

  settingsStore.save({
    ...DEFAULT_USER_SETTINGS,
    ...overrides,
  })
}

export function writeCorruptedDiagnostics(
  recoveryIssue: DiagnosticsRecoveryIssue,
  storage: BrowserStorage = window.localStorage,
) {
  if (recoveryIssue === 'invalid-format') {
    storage.setItem(DIAGNOSTICS_STORAGE_KEY, '{not valid json')

    return
  }

  if (recoveryIssue === 'unsupported-version') {
    storage.setItem(
      DIAGNOSTICS_STORAGE_KEY,
      JSON.stringify({
        entries: [],
        version: 999,
      }),
    )

    return
  }

  storage.setItem(
    DIAGNOSTICS_STORAGE_KEY,
    JSON.stringify({
      entries: [{ invalid: true }],
      version: 1,
    }),
  )
}

export function writeCorruptedSettings(
  value: string = '{not valid json',
  storage: BrowserStorage = window.localStorage,
) {
  storage.setItem(SETTINGS_STORAGE_KEY, value)
}

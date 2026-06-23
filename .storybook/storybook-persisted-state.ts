import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
} from '../src/domain/settings'
import { READ_ONLY_NOTICE_STORAGE_KEY } from '../src/features/availability/read-only-notice-storage'
import { DIAGNOSTICS_STORAGE_KEY } from '../src/features/diagnostics/logs'
import {
  DEVELOPER_MODE_STORAGE_KEY,
  saveDeveloperModeEnabled,
} from '../src/features/settings/developer-mode-storage'
import {
  type BrowserStorage,
  LocalSettingsStore,
  SETTINGS_STORAGE_KEY,
} from '../src/lib/storage/local-storage'

export function clearPersistedStorybookState(storage: BrowserStorage) {
  storage.removeItem(DEVELOPER_MODE_STORAGE_KEY)
  storage.removeItem(DIAGNOSTICS_STORAGE_KEY)
  storage.removeItem(READ_ONLY_NOTICE_STORAGE_KEY)
  storage.removeItem(SETTINGS_STORAGE_KEY)
}

export function saveStorybookUserSettings(
  overrides: Partial<UserSettings>,
  storage: BrowserStorage,
) {
  const settingsStore = new LocalSettingsStore({ storage })

  settingsStore.save({
    ...DEFAULT_USER_SETTINGS,
    ...overrides,
  })
}

export function enableStorybookDeveloperMode(storage: BrowserStorage) {
  saveDeveloperModeEnabled(true, storage)
}

export function writeStorybookCorruptedSettings(
  storage: BrowserStorage,
  value: string = '{not valid json',
) {
  storage.setItem(SETTINGS_STORAGE_KEY, value)
}

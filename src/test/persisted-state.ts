import { clearKnownPersistedState } from '../app/persisted-state'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../domain/settings'
import { saveDeveloperModeEnabled } from '../features/settings/developer-mode-storage'
import {
  type BrowserStorage,
  LocalSettingsStore,
  SETTINGS_STORAGE_KEY,
} from '../lib/storage/local-storage'

export function clearPersistedAppState(
  storage: BrowserStorage = window.localStorage,
) {
  clearKnownPersistedState(storage)
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

export function enableDeveloperMode(
  storage: BrowserStorage = window.localStorage,
) {
  saveDeveloperModeEnabled(true, storage)
}

export function writeCorruptedSettings(
  value: string = '{not valid json',
  storage: BrowserStorage = window.localStorage,
) {
  storage.setItem(SETTINGS_STORAGE_KEY, value)
}

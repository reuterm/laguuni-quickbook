import { clearKnownPersistedState } from '../src/app/persisted-state'
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
} from '../src/domain/settings'
import { saveDeveloperModeEnabled } from '../src/features/settings/developer-mode-storage'
import {
  type BrowserStorage,
  LocalSettingsStore,
  SETTINGS_STORAGE_KEY,
} from '../src/lib/storage/local-storage'

export type StorybookPersistedStateSeed = {
  developerMode?: boolean
  seedCorruptedSettings?: boolean
  settings?: Partial<UserSettings>
}

type CanonicalStorybookPersistedStateSeed = {
  developerMode: boolean
  seedCorruptedSettings: boolean
  settings: UserSettings | null
}

export function seedStorybookPersistedState(
  {
    developerMode = false,
    seedCorruptedSettings = false,
    settings,
  }: StorybookPersistedStateSeed,
  storage: BrowserStorage,
) {
  clearKnownPersistedState(storage)

  if (seedCorruptedSettings) {
    writeStorybookCorruptedSettings(storage)
  } else if (settings) {
    saveStorybookUserSettings(settings, storage)
  }

  if (developerMode) {
    enableStorybookDeveloperMode(storage)
  }
}

export function createStorybookPersistedStateIdentity(
  storyId: string,
  seed: StorybookPersistedStateSeed,
): string {
  return JSON.stringify({
    storyId,
    persistedState: getCanonicalStorybookPersistedStateSeed(seed),
  })
}

function getCanonicalStorybookPersistedStateSeed({
  developerMode = false,
  seedCorruptedSettings = false,
  settings,
}: StorybookPersistedStateSeed): CanonicalStorybookPersistedStateSeed {
  return {
    developerMode,
    seedCorruptedSettings,
    settings: seedCorruptedSettings
      ? null
      : settings === undefined
        ? null
        : {
            ...DEFAULT_USER_SETTINGS,
            ...settings,
          },
  }
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

import { describe, expect, it } from 'vitest'

import type { UserSettings } from '../../domain/settings'
import {
  type BrowserStorage,
  LocalSettingsStore,
  SETTINGS_STORAGE_KEY,
} from './local-storage'

const FIXTURE_SETTINGS: UserSettings = {
  availabilityView: 'calendar',
  defaultCable: 'easy',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+358401234567',
  seasonPassCode: 'FIXTURE-CODE',
}

describe('LocalSettingsStore', () => {
  it('returns default settings when nothing has been stored', () => {
    const store = new LocalSettingsStore({
      storage: createMemoryStorage(),
    })

    expect(store.load()).toEqual({
      availabilityView: 'cards',
      defaultCable: null,
      email: '',
      name: '',
      phone: '',
      seasonPassCode: '',
    })
    expect(store.loadState()).toEqual({
      recoveryIssue: null,
      settings: {
        availabilityView: 'cards',
        defaultCable: null,
        email: '',
        name: '',
        phone: '',
        seasonPassCode: '',
      },
    })
  })

  it('stores versioned settings payloads and reloads them', () => {
    const storage = createMemoryStorage()
    const store = new LocalSettingsStore({ storage })

    store.save(FIXTURE_SETTINGS)

    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBe(
      JSON.stringify({
        ...FIXTURE_SETTINGS,
        version: 1,
      }),
    )
    expect(store.load()).toEqual(FIXTURE_SETTINGS)
  })

  it('loads legacy unversioned settings payloads', () => {
    const storage = createMemoryStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify(FIXTURE_SETTINGS),
    })
    const store = new LocalSettingsStore({ storage })

    expect(store.load()).toEqual(FIXTURE_SETTINGS)
    expect(store.loadState().recoveryIssue).toBeNull()
  })

  it('falls back to defaults for malformed JSON and unsupported versions', () => {
    const invalidJsonStore = new LocalSettingsStore({
      storage: createMemoryStorage({
        [SETTINGS_STORAGE_KEY]: '{not valid json',
      }),
    })
    const unsupportedVersionStore = new LocalSettingsStore({
      storage: createMemoryStorage({
        [SETTINGS_STORAGE_KEY]: JSON.stringify({
          ...FIXTURE_SETTINGS,
          version: 2,
        }),
      }),
    })

    expect(invalidJsonStore.load()).toEqual({
      availabilityView: 'cards',
      defaultCable: null,
      email: '',
      name: '',
      phone: '',
      seasonPassCode: '',
    })
    expect(invalidJsonStore.loadState()).toEqual({
      recoveryIssue: 'invalid-format',
      settings: {
        availabilityView: 'cards',
        defaultCable: null,
        email: '',
        name: '',
        phone: '',
        seasonPassCode: '',
      },
    })
    expect(unsupportedVersionStore.load()).toEqual({
      availabilityView: 'cards',
      defaultCable: null,
      email: '',
      name: '',
      phone: '',
      seasonPassCode: '',
    })
    expect(unsupportedVersionStore.loadState()).toEqual({
      recoveryIssue: 'unsupported-version',
      settings: {
        availabilityView: 'cards',
        defaultCable: null,
        email: '',
        name: '',
        phone: '',
        seasonPassCode: '',
      },
    })
  })

  it('normalizes invalid stored fields back to safe defaults', () => {
    const store = new LocalSettingsStore({
      storage: createMemoryStorage({
        [SETTINGS_STORAGE_KEY]: JSON.stringify({
          defaultCable: 'hietsu',
          availabilityView: 'grid',
          email: 123,
          name: 'Test User',
          phone: ['invalid'],
          seasonPassCode: null,
          version: 1,
        }),
      }),
    })

    expect(store.load()).toEqual({
      availabilityView: 'cards',
      defaultCable: null,
      email: '',
      name: 'Test User',
      phone: '',
      seasonPassCode: '',
    })
    expect(store.loadState()).toEqual({
      recoveryIssue: 'invalid-fields',
      settings: {
        availabilityView: 'cards',
        defaultCable: null,
        email: '',
        name: 'Test User',
        phone: '',
        seasonPassCode: '',
      },
    })
  })
})

function createMemoryStorage(
  initialEntries: Record<string, string> = {},
): BrowserStorage {
  const values = new Map(Object.entries(initialEntries))

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

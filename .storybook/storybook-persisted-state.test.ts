import { afterEach, describe, expect, it } from 'vitest'

import { SETTINGS_STORAGE_KEY } from '../src/lib/storage/local-storage'
import { DEVELOPER_MODE_STORAGE_KEY } from '../src/features/settings/developer-mode-storage'
import {
  createInMemoryBrowserStorage,
  seedStorybookPersistedState,
} from './storybook-persisted-state'

describe('storybook persisted state', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('seeds settings and developer mode into an isolated storage instance', () => {
    window.localStorage.setItem(DEVELOPER_MODE_STORAGE_KEY, 'true')
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

    const storage = createInMemoryBrowserStorage()

    seedStorybookPersistedState(
      {
        developerMode: true,
        settings: {
          email: 'storybook@example.com',
          name: 'Storybook User',
        },
      },
      storage,
    )

    expect(storage.getItem(DEVELOPER_MODE_STORAGE_KEY)).toBe('true')
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toContain('storybook@example.com')
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toContain('Storybook User')
    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toContain(
      'window@example.com',
    )
  })

  it('can seed corrupted settings without touching window.localStorage', () => {
    const storage = createInMemoryBrowserStorage()

    seedStorybookPersistedState(
      {
        seedCorruptedSettings: true,
      },
      storage,
    )

    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBe('{not valid json')
    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull()
  })
})

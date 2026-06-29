import { describe, expect, it } from 'vitest'
import {
  clearKnownPersistedState,
  KNOWN_PERSISTED_STORAGE_KEYS,
} from '../app/persisted-state'
import { READ_ONLY_NOTICE_STORAGE_KEY } from '../features/availability/read-only-notice-storage'
import { DIAGNOSTICS_STORAGE_KEY } from '../features/diagnostics/logs'
import { DEVELOPER_MODE_STORAGE_KEY } from '../features/settings/developer-mode-storage'
import { SETTINGS_STORAGE_KEY } from '../lib/storage/local-storage'
import { createMemoryStorage } from '../lib/storage/memory-storage'

describe('clearKnownPersistedState', () => {
  it('removes every known persisted storage key from the provided storage', () => {
    const storage = createMemoryStorage({
      [DEVELOPER_MODE_STORAGE_KEY]: 'true',
      [DIAGNOSTICS_STORAGE_KEY]: 'diagnostics payload',
      [READ_ONLY_NOTICE_STORAGE_KEY]: 'true',
      [SETTINGS_STORAGE_KEY]: 'settings payload',
      untouched: 'keep me',
    })

    clearKnownPersistedState(storage)

    expect(KNOWN_PERSISTED_STORAGE_KEYS).toEqual([
      DEVELOPER_MODE_STORAGE_KEY,
      DIAGNOSTICS_STORAGE_KEY,
      READ_ONLY_NOTICE_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
    ])
    expect(storage.getItem(DEVELOPER_MODE_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(DIAGNOSTICS_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(READ_ONLY_NOTICE_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBeNull()
    expect(storage.getItem('untouched')).toBe('keep me')
  })
})

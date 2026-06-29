import { READ_ONLY_NOTICE_STORAGE_KEY } from '../features/availability/read-only-notice-storage'
import { DIAGNOSTICS_STORAGE_KEY } from '../features/diagnostics/logs'
import { DEVELOPER_MODE_STORAGE_KEY } from '../features/settings/developer-mode-storage'
import type { BrowserStorage } from '../lib/storage/local-storage'
import { SETTINGS_STORAGE_KEY } from '../lib/storage/local-storage'

export const KNOWN_PERSISTED_STORAGE_KEYS = [
  DEVELOPER_MODE_STORAGE_KEY,
  DIAGNOSTICS_STORAGE_KEY,
  READ_ONLY_NOTICE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
] as const

export function clearKnownPersistedState(storage: BrowserStorage) {
  for (const storageKey of KNOWN_PERSISTED_STORAGE_KEYS) {
    storage.removeItem(storageKey)
  }
}

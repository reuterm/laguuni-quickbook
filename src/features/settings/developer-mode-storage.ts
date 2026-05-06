import {
  type BrowserStorage,
  createBrowserStorage,
} from '../../lib/storage/local-storage'

export const DEVELOPER_MODE_STORAGE_KEY =
  'laguuni.quickbook.settings.developer-mode'

export function loadDeveloperModeEnabled(
  storage: BrowserStorage = createBrowserStorage(),
): boolean {
  return storage.getItem(DEVELOPER_MODE_STORAGE_KEY) === 'true'
}

export function saveDeveloperModeEnabled(
  enabled: boolean,
  storage: BrowserStorage = createBrowserStorage(),
): void {
  if (enabled) {
    storage.setItem(DEVELOPER_MODE_STORAGE_KEY, 'true')

    return
  }

  storage.removeItem(DEVELOPER_MODE_STORAGE_KEY)
}

import {
  type BrowserStorage,
  createBrowserStorage,
} from '../../lib/storage/local-storage'

export const READ_ONLY_NOTICE_STORAGE_KEY =
  'laguuni.quickbook.read-only-notice-dismissed'

export function loadReadOnlyNoticeDismissed(
  storage: BrowserStorage = createBrowserStorage(),
): boolean {
  return storage.getItem(READ_ONLY_NOTICE_STORAGE_KEY) === 'true'
}

export function saveReadOnlyNoticeDismissed(
  isDismissed: boolean,
  storage: BrowserStorage = createBrowserStorage(),
): void {
  if (isDismissed) {
    storage.setItem(READ_ONLY_NOTICE_STORAGE_KEY, 'true')

    return
  }

  storage.removeItem(READ_ONLY_NOTICE_STORAGE_KEY)
}

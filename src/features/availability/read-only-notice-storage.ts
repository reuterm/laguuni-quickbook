import type { BrowserStorage } from '../../lib/storage/local-storage'

export const READ_ONLY_NOTICE_STORAGE_KEY =
  'laguuni.quickbook.read-only-notice-dismissed'

export type ReadOnlyNoticeStore = {
  isDismissed(): boolean
  dismiss(): void
}

export class LocalReadOnlyNoticeStore implements ReadOnlyNoticeStore {
  readonly #storage: BrowserStorage

  constructor({ storage }: { storage: BrowserStorage }) {
    this.#storage = storage
  }

  isDismissed(): boolean {
    return this.#storage.getItem(READ_ONLY_NOTICE_STORAGE_KEY) === 'true'
  }

  dismiss(): void {
    this.#storage.setItem(READ_ONLY_NOTICE_STORAGE_KEY, 'true')
  }
}

import { isCableId } from '../../domain/cable'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../../domain/settings'
import { isRecord } from '../type-guards'

export const SETTINGS_STORAGE_KEY = 'laguuni.quickbook.settings'

export type BrowserStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>

export type UserSettingsStore = {
  clear(): void
  load(): UserSettings
  save(settings: UserSettings): void
}

export type LocalSettingsStoreOptions = {
  storage: BrowserStorage
  storageKey?: string
}

export function createBrowserStorage(): BrowserStorage {
  if (typeof window === 'undefined') {
    throw new Error('Browser storage is only available in the browser runtime')
  }

  return window.localStorage
}

export class LocalSettingsStore implements UserSettingsStore {
  readonly #storage: BrowserStorage
  readonly #storageKey: string

  constructor({
    storage,
    storageKey = SETTINGS_STORAGE_KEY,
  }: LocalSettingsStoreOptions) {
    this.#storage = storage
    this.#storageKey = storageKey
  }

  clear(): void {
    this.#storage.removeItem(this.#storageKey)
  }

  load(): UserSettings {
    const storedSettings = this.#storage.getItem(this.#storageKey)

    if (storedSettings === null) {
      return DEFAULT_USER_SETTINGS
    }

    return normalizeStoredSettings(JSON.parse(storedSettings))
  }

  save(settings: UserSettings): void {
    this.#storage.setItem(this.#storageKey, JSON.stringify(settings))
  }
}

function normalizeStoredSettings(value: unknown): UserSettings {
  if (!isRecord(value)) {
    return DEFAULT_USER_SETTINGS
  }

  return {
    defaultCable:
      typeof value.defaultCable === 'string' && isCableId(value.defaultCable)
        ? value.defaultCable
        : DEFAULT_USER_SETTINGS.defaultCable,
    email:
      typeof value.email === 'string'
        ? value.email
        : DEFAULT_USER_SETTINGS.email,
    name:
      typeof value.name === 'string' ? value.name : DEFAULT_USER_SETTINGS.name,
    phone:
      typeof value.phone === 'string'
        ? value.phone
        : DEFAULT_USER_SETTINGS.phone,
    seasonPassCode:
      typeof value.seasonPassCode === 'string'
        ? value.seasonPassCode
        : DEFAULT_USER_SETTINGS.seasonPassCode,
  }
}

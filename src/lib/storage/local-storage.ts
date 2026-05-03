import { type CableId, isCableId } from '../../domain/cable'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../../domain/settings'
import { isRecord } from '../type-guards'

export const SETTINGS_STORAGE_KEY = 'laguuni.quickbook.settings'
const USER_SETTINGS_STORAGE_VERSION = 1

type StoredUserSettingsFields = {
  defaultCable?: CableId | null | undefined
  email?: string | undefined
  name?: string | undefined
  phone?: string | undefined
  seasonPassCode?: string | undefined
}

type StoredUserSettingsV1 = StoredUserSettingsFields & {
  version: typeof USER_SETTINGS_STORAGE_VERSION
}

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

    return decodeStoredSettingsFromString(storedSettings)
  }

  save(settings: UserSettings): void {
    this.#storage.setItem(
      this.#storageKey,
      JSON.stringify(createStoredSettings(settings)),
    )
  }
}

function createStoredSettings(settings: UserSettings): StoredUserSettingsV1 {
  return {
    defaultCable: settings.defaultCable,
    email: settings.email,
    name: settings.name,
    phone: settings.phone,
    seasonPassCode: settings.seasonPassCode,
    version: USER_SETTINGS_STORAGE_VERSION,
  }
}

function decodeStoredSettingsFromString(value: string): UserSettings {
  try {
    return decodeStoredSettings(JSON.parse(value))
  } catch {
    return DEFAULT_USER_SETTINGS
  }
}

function decodeStoredSettings(value: unknown): UserSettings {
  if (!isRecord(value)) {
    return DEFAULT_USER_SETTINGS
  }

  if ('version' in value && value.version !== USER_SETTINGS_STORAGE_VERSION) {
    return DEFAULT_USER_SETTINGS
  }

  return {
    defaultCable:
      value.defaultCable === null
        ? null
        : typeof value.defaultCable === 'string' &&
            isCableId(value.defaultCable)
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

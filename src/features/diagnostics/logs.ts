import { v4 as uuidv4 } from 'uuid'

import type { BrowserStorage } from '../../lib/storage/local-storage'

export const DIAGNOSTICS_STORAGE_KEY = 'laguuni.quickbook.diagnostics'
const DIAGNOSTICS_STORAGE_VERSION = 1
const DEFAULT_MAX_ENTRIES = 50

type DiagnosticFieldValue = boolean | number | string | null

export type DiagnosticFields = Record<string, DiagnosticFieldValue>
export type DiagnosticsRecoveryIssue =
  | 'invalid-entries'
  | 'invalid-format'
  | 'unsupported-version'

export type DiagnosticEntry = {
  appVersion: string
  event: string
  fields: DiagnosticFields
  platform: string
  timestamp: string
  traceId: string
}

type StoredDiagnosticsLog = {
  entries: readonly DiagnosticEntry[]
  version: typeof DIAGNOSTICS_STORAGE_VERSION
}

export type DiagnosticsLoadResult = {
  entries: readonly DiagnosticEntry[]
  recoveryIssue: DiagnosticsRecoveryIssue | null
}

export type Diagnostics = {
  append(entry: DiagnosticWriteEntry): void
  clear(): void
  exportLogs(): string
  listEntries(): readonly DiagnosticEntry[]
  loadState(): DiagnosticsLoadResult
  readonly traceId: string
}

export type DiagnosticWriteEntry = {
  event: string
  fields?: DiagnosticFields
}

type LocalDiagnosticsOptions = {
  appVersion: string
  maxEntries?: number
  now?: () => Date
  platform?: string
  storage: BrowserStorage
  storageKey?: string
  traceId?: string
}

export class LocalDiagnosticsStore implements Diagnostics {
  readonly #appVersion: string
  readonly #maxEntries: number
  readonly #now: () => Date
  readonly #platform: string
  readonly #storage: BrowserStorage
  readonly #storageKey: string
  readonly traceId: string

  constructor({
    appVersion,
    maxEntries = DEFAULT_MAX_ENTRIES,
    now = () => new Date(),
    platform = readPlatform(),
    storage,
    storageKey = DIAGNOSTICS_STORAGE_KEY,
    traceId = uuidv4(),
  }: LocalDiagnosticsOptions) {
    this.#appVersion = appVersion
    this.#maxEntries = maxEntries
    this.#now = now
    this.#platform = platform
    this.#storage = storage
    this.#storageKey = storageKey
    this.traceId = traceId
  }

  clear(): void {
    this.#storage.removeItem(this.#storageKey)
  }

  exportLogs(): string {
    return JSON.stringify(this.loadState(), null, 2)
  }

  listEntries(): readonly DiagnosticEntry[] {
    return this.loadState().entries
  }

  loadState(): DiagnosticsLoadResult {
    return readDiagnosticsState(this.#storage, this.#storageKey)
  }

  append({ event, fields = {} }: DiagnosticWriteEntry): void {
    const nextEntry: DiagnosticEntry = {
      appVersion: this.#appVersion,
      event,
      fields,
      platform: this.#platform,
      timestamp: this.#now().toISOString(),
      traceId: this.traceId,
    }

    const existingEntries = this.loadState().entries
    const entries = [...existingEntries, nextEntry].slice(-this.#maxEntries)

    this.#storage.setItem(
      this.#storageKey,
      JSON.stringify({
        entries,
        version: DIAGNOSTICS_STORAGE_VERSION,
      } satisfies StoredDiagnosticsLog),
    )
  }
}

function readDiagnosticsState(
  storage: BrowserStorage,
  storageKey: string,
): DiagnosticsLoadResult {
  const storedValue = storage.getItem(storageKey)

  if (storedValue === null) {
    return {
      entries: [],
      recoveryIssue: null,
    }
  }

  try {
    return decodeStoredDiagnostics(JSON.parse(storedValue))
  } catch {
    return {
      entries: [],
      recoveryIssue: 'invalid-format',
    }
  }
}

function decodeStoredDiagnostics(value: unknown): DiagnosticsLoadResult {
  if (typeof value !== 'object' || value === null || !('version' in value)) {
    return {
      entries: [],
      recoveryIssue: 'invalid-format',
    }
  }

  if (value.version !== DIAGNOSTICS_STORAGE_VERSION) {
    return {
      entries: [],
      recoveryIssue: 'unsupported-version',
    }
  }

  if (!('entries' in value) || !Array.isArray(value.entries)) {
    return {
      entries: [],
      recoveryIssue: 'invalid-format',
    }
  }

  if (!value.entries.every(isDiagnosticEntry)) {
    return {
      entries: [],
      recoveryIssue: 'invalid-entries',
    }
  }

  const entries = value.entries.filter(isDiagnosticEntry)

  return {
    entries,
    recoveryIssue: null,
  }
}

function isDiagnosticEntry(value: unknown): value is DiagnosticEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'appVersion' in value &&
    typeof value.appVersion === 'string' &&
    'event' in value &&
    typeof value.event === 'string' &&
    'fields' in value &&
    isDiagnosticFields(value.fields) &&
    'platform' in value &&
    typeof value.platform === 'string' &&
    'timestamp' in value &&
    typeof value.timestamp === 'string' &&
    'traceId' in value &&
    typeof value.traceId === 'string'
  )
}

function isDiagnosticFields(value: unknown): value is DiagnosticFields {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return Object.values(value).every(
    (fieldValue) =>
      fieldValue === null ||
      typeof fieldValue === 'boolean' ||
      typeof fieldValue === 'number' ||
      typeof fieldValue === 'string',
  )
}

function readPlatform(): string {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }

  return navigator.userAgent
}

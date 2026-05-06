import { v4 as uuidv4 } from 'uuid'

import type { BrowserStorage } from '../../lib/storage/local-storage'

export const DIAGNOSTICS_STORAGE_KEY = 'laguuni.quickbook.diagnostics'
const DIAGNOSTICS_STORAGE_VERSION = 2
const DEFAULT_MAX_AGE_DAYS = 7
const DEFAULT_MAX_ENTRIES = 200

export type DiagnosticValue =
  | boolean
  | number
  | string
  | null
  | readonly DiagnosticValue[]
  | { readonly [key: string]: DiagnosticValue }

export type DiagnosticData = Record<string, DiagnosticValue>
export type DiagnosticsRecoveryIssue =
  | 'invalid-entries'
  | 'invalid-format'
  | 'unsupported-version'

export type DiagnosticEntry = {
  appVersion: string
  data: DiagnosticData
  event: string
  platform: string
  sessionId: string
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

export type DiagnosticEvent = {
  data?: DiagnosticData
  event: string
}

export type DiagnosticsExportOptions = {
  traceId?: string
}

export type DiagnosticsTrace = {
  append(event: DiagnosticEvent): void
  readonly traceId: string
}

export type Diagnostics = {
  beginTrace(options?: { name?: string }): DiagnosticsTrace
  clear(): void
  exportLogs(options?: DiagnosticsExportOptions): string
  listEntries(options?: DiagnosticsExportOptions): readonly DiagnosticEntry[]
  loadState(): DiagnosticsLoadResult
  readonly sessionId: string
}

type LocalDiagnosticsOptions = {
  appVersion: string
  createId?: () => string
  maxAgeDays?: number
  maxEntries?: number
  now?: () => Date
  platform?: string
  sessionId?: string
  storage: BrowserStorage
  storageKey?: string
}

export class LocalDiagnosticsStore implements Diagnostics {
  readonly #appVersion: string
  readonly #createId: () => string
  readonly #maxAgeMs: number
  readonly #maxEntries: number
  readonly #now: () => Date
  readonly #platform: string
  readonly #storage: BrowserStorage
  readonly #storageKey: string
  readonly sessionId: string

  constructor({
    appVersion,
    createId = uuidv4,
    maxAgeDays = DEFAULT_MAX_AGE_DAYS,
    maxEntries = DEFAULT_MAX_ENTRIES,
    now = () => new Date(),
    platform = readPlatform(),
    sessionId = createId(),
    storage,
    storageKey = DIAGNOSTICS_STORAGE_KEY,
  }: LocalDiagnosticsOptions) {
    this.#appVersion = appVersion
    this.#createId = createId
    this.#maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
    this.#maxEntries = maxEntries
    this.#now = now
    this.#platform = platform
    this.#storage = storage
    this.#storageKey = storageKey
    this.sessionId = sessionId
  }

  beginTrace(options?: { name?: string }): DiagnosticsTrace {
    void options?.name

    return new LocalDiagnosticsTrace({
      append: (entry) => {
        this.#appendEntry(entry)
      },
      traceId: this.#createId(),
    })
  }

  clear(): void {
    this.#storage.removeItem(this.#storageKey)
  }

  exportLogs(options: DiagnosticsExportOptions = {}): string {
    const state = this.loadState()

    return JSON.stringify(
      {
        entries: filterEntries(state.entries, options.traceId),
        recoveryIssue: state.recoveryIssue,
      },
      null,
      2,
    )
  }

  listEntries(
    options: DiagnosticsExportOptions = {},
  ): readonly DiagnosticEntry[] {
    return filterEntries(this.loadState().entries, options.traceId)
  }

  loadState(): DiagnosticsLoadResult {
    const state = readDiagnosticsState(this.#storage, this.#storageKey)
    const entries = pruneEntries(
      state.entries,
      this.#now(),
      this.#maxAgeMs,
    ).slice(-this.#maxEntries)

    if (entries.length !== state.entries.length) {
      this.#writeEntries(entries)
    }

    return {
      entries,
      recoveryIssue: state.recoveryIssue,
    }
  }

  #appendEntry({
    data = {},
    event,
    traceId,
  }: DiagnosticEvent & { traceId: string }) {
    const nextEntry: DiagnosticEntry = {
      appVersion: this.#appVersion,
      data,
      event,
      platform: this.#platform,
      sessionId: this.sessionId,
      timestamp: this.#now().toISOString(),
      traceId,
    }

    const entries = pruneEntries(
      [...this.loadState().entries, nextEntry],
      this.#now(),
      this.#maxAgeMs,
    ).slice(-this.#maxEntries)

    this.#writeEntries(entries)
  }

  #writeEntries(entries: readonly DiagnosticEntry[]) {
    this.#storage.setItem(
      this.#storageKey,
      JSON.stringify({
        entries,
        version: DIAGNOSTICS_STORAGE_VERSION,
      } satisfies StoredDiagnosticsLog),
    )
  }
}

class LocalDiagnosticsTrace implements DiagnosticsTrace {
  readonly #append: (entry: DiagnosticEvent & { traceId: string }) => void
  readonly traceId: string

  constructor({
    append,
    traceId,
  }: {
    append: (entry: DiagnosticEvent & { traceId: string }) => void
    traceId: string
  }) {
    this.#append = append
    this.traceId = traceId
  }

  append({ data = {}, event }: DiagnosticEvent): void {
    this.#append({
      data,
      event,
      traceId: this.traceId,
    })
  }
}

function filterEntries(
  entries: readonly DiagnosticEntry[],
  traceId?: string,
): readonly DiagnosticEntry[] {
  if (traceId === undefined) {
    return entries
  }

  return entries.filter((entry) => entry.traceId === traceId)
}

function pruneEntries(
  entries: readonly DiagnosticEntry[],
  now: Date,
  maxAgeMs: number,
): readonly DiagnosticEntry[] {
  const cutoff = now.getTime() - maxAgeMs

  return entries.filter((entry) => {
    const timestamp = Date.parse(entry.timestamp)

    return Number.isFinite(timestamp) && timestamp >= cutoff
  })
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

  return {
    entries: value.entries.filter(isDiagnosticEntry),
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
    'data' in value &&
    isDiagnosticData(value.data) &&
    'event' in value &&
    typeof value.event === 'string' &&
    'platform' in value &&
    typeof value.platform === 'string' &&
    'sessionId' in value &&
    typeof value.sessionId === 'string' &&
    'timestamp' in value &&
    typeof value.timestamp === 'string' &&
    'traceId' in value &&
    typeof value.traceId === 'string'
  )
}

function isDiagnosticData(value: unknown): value is DiagnosticData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(isDiagnosticValue)
}

function isDiagnosticValue(value: unknown): value is DiagnosticValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isDiagnosticValue)
  }

  if (typeof value !== 'object') {
    return false
  }

  return Object.values(value).every(isDiagnosticValue)
}

function readPlatform(): string {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }

  return navigator.userAgent
}

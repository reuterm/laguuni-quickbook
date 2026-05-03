import { describe, expect, it } from 'vitest'

import { LocalDiagnosticsStore } from './logs'

describe('LocalDiagnosticsStore', () => {
  it('records bounded trace-tagged entries with app metadata', () => {
    const storage = createMemoryStorage()
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      maxEntries: 2,
      now: () => new Date('2026-05-03T12:00:00.000Z'),
      platform: 'Vitest Browser',
      storage,
      traceId: 'lqk-fixedtrace',
    })

    diagnostics.append({
      event: 'booking.started',
      fields: {
        cableId: 'pro',
        hasCode: true,
      },
    })
    diagnostics.append({
      event: 'booking.checkout_completed',
      fields: {
        outcome: 'success',
      },
    })
    diagnostics.append({
      event: 'booking.checkout_completed',
      fields: {
        outcome: 'payment_required',
      },
    })

    expect(diagnostics.loadState()).toEqual({
      entries: [
        {
          appVersion: '0.1.0',
          event: 'booking.checkout_completed',
          fields: {
            outcome: 'success',
          },
          platform: 'Vitest Browser',
          timestamp: '2026-05-03T12:00:00.000Z',
          traceId: 'lqk-fixedtrace',
        },
        {
          appVersion: '0.1.0',
          event: 'booking.checkout_completed',
          fields: {
            outcome: 'payment_required',
          },
          platform: 'Vitest Browser',
          timestamp: '2026-05-03T12:00:00.000Z',
          traceId: 'lqk-fixedtrace',
        },
      ],
      recoveryIssue: null,
    })
  })

  it('surfaces a recovery issue when stored diagnostics are corrupted', () => {
    const storage = createMemoryStorage()
    storage.setItem('fixture', '{not valid json')

    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      storage,
      storageKey: 'fixture',
      traceId: 'lqk-fixedtrace',
    })

    expect(diagnostics.loadState()).toEqual({
      entries: [],
      recoveryIssue: 'invalid-format',
    })
    expect(diagnostics.exportLogs()).toContain(
      '"recoveryIssue": "invalid-format"',
    )
  })

  it('surfaces invalid entries separately from invalid top-level JSON', () => {
    const storage = createMemoryStorage()
    storage.setItem(
      'fixture',
      JSON.stringify({
        entries: [{ invalid: true }],
        version: 1,
      }),
    )

    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      storage,
      storageKey: 'fixture',
      traceId: 'lqk-fixedtrace',
    })

    expect(diagnostics.loadState()).toEqual({
      entries: [],
      recoveryIssue: 'invalid-entries',
    })
  })
})

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

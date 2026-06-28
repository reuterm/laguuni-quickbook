import { describe, expect, it } from 'vitest'

import { createMemoryStorage } from '../../test/create-memory-storage'
import { LocalDiagnosticsStore } from './logs'

describe('LocalDiagnosticsStore', () => {
  it('records bounded trace-tagged entries with app and session metadata', () => {
    const storage = createMemoryStorage()
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: createFixedIdFactory(['session-fixed', 'trace-fixed']),
      maxEntries: 2,
      now: () => new Date('2026-05-03T12:00:00.000Z'),
      platform: 'Vitest Browser',
      storage,
    })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    trace.append({
      data: {
        cableId: 'pro',
        hasCode: true,
      },
      event: 'booking.started',
    })
    trace.append({
      data: {
        outcome: 'success',
      },
      event: 'booking.checkout_completed',
    })
    trace.append({
      data: {
        outcome: 'payment_required',
      },
      event: 'booking.checkout_completed',
    })

    expect(diagnostics.loadState()).toEqual({
      entries: [
        {
          appVersion: '0.1.0',
          data: {
            outcome: 'success',
          },
          event: 'booking.checkout_completed',
          platform: 'Vitest Browser',
          sessionId: 'session-fixed',
          timestamp: '2026-05-03T12:00:00.000Z',
          traceId: 'trace-fixed',
        },
        {
          appVersion: '0.1.0',
          data: {
            outcome: 'payment_required',
          },
          event: 'booking.checkout_completed',
          platform: 'Vitest Browser',
          sessionId: 'session-fixed',
          timestamp: '2026-05-03T12:00:00.000Z',
          traceId: 'trace-fixed',
        },
      ],
      recoveryIssue: null,
    })
  })

  it('exports only the requested trace when filtered', () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: createFixedIdFactory([
        'session-fixed',
        'trace-booking',
        'trace-availability',
      ]),
      now: () => new Date('2026-05-03T12:00:00.000Z'),
      platform: 'Vitest Browser',
      storage: createMemoryStorage(),
    })
    const bookingTrace = diagnostics.beginTrace({ name: 'booking' })
    const availabilityTrace = diagnostics.beginTrace({ name: 'availability' })

    bookingTrace.append({
      event: 'booking.started',
    })
    availabilityTrace.append({
      event: 'availability.loaded',
    })

    const exportedLogs = diagnostics.exportLogs({ traceId: 'trace-booking' })

    expect(exportedLogs).toContain('trace-booking')
    expect(exportedLogs).toContain('booking.started')
    expect(exportedLogs).not.toContain('availability.loaded')
    expect(exportedLogs).not.toContain('trace-availability')
  })

  it('prunes entries older than the retention window when loading and appending', () => {
    const storage = createMemoryStorage()
    storage.setItem(
      'fixture',
      JSON.stringify({
        entries: [
          {
            appVersion: '0.1.0',
            data: {},
            event: 'booking.old',
            platform: 'Vitest Browser',
            sessionId: 'session-old',
            timestamp: '2026-04-20T12:00:00.000Z',
            traceId: 'trace-old',
          },
          {
            appVersion: '0.1.0',
            data: {},
            event: 'booking.recent',
            platform: 'Vitest Browser',
            sessionId: 'session-old',
            timestamp: '2026-05-02T12:00:00.000Z',
            traceId: 'trace-old',
          },
        ],
        version: 2,
      }),
    )

    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: createFixedIdFactory(['session-fixed', 'trace-fixed']),
      maxAgeDays: 7,
      now: () => new Date('2026-05-03T12:00:00.000Z'),
      platform: 'Vitest Browser',
      storage,
      storageKey: 'fixture',
    })

    expect(diagnostics.listEntries()).toEqual([
      expect.objectContaining({
        event: 'booking.recent',
      }),
    ])

    const trace = diagnostics.beginTrace({ name: 'booking' })
    trace.append({
      event: 'booking.current',
    })

    expect(diagnostics.listEntries().map((entry) => entry.event)).toEqual([
      'booking.recent',
      'booking.current',
    ])

    expect(storage.getItem('fixture')).toContain('booking.recent')
    expect(storage.getItem('fixture')).toContain('booking.current')
    expect(storage.getItem('fixture')).not.toContain('booking.old')
  })

  it('surfaces a recovery issue when stored diagnostics are corrupted', () => {
    const storage = createMemoryStorage()
    storage.setItem('fixture', '{not valid json')

    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      storage,
      storageKey: 'fixture',
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
        version: 2,
      }),
    )

    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      storage,
      storageKey: 'fixture',
    })

    expect(diagnostics.loadState()).toEqual({
      entries: [],
      recoveryIssue: 'invalid-entries',
    })
  })
})

function createFixedIdFactory(values: readonly string[]) {
  let index = 0

  return () => {
    const value = values[index]

    if (value === undefined) {
      throw new Error('Ran out of fixed diagnostic IDs')
    }

    index += 1
    return value
  }
}

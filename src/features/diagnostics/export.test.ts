import { describe, expect, it, vi } from 'vitest'

import { exportDiagnosticsForTrace } from './export'

describe('diagnostics export', () => {
  it('copies only the requested trace diagnostics', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText,
      },
    })

    await exportDiagnosticsForTrace(
      ({ traceId }) => JSON.stringify({ traceId }),
      'test-trace-id',
    )

    expect(writeText).toHaveBeenCalledWith(
      JSON.stringify({ traceId: 'test-trace-id' }),
    )

    vi.unstubAllGlobals()
  })
})

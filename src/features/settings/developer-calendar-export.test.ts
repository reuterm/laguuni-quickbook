import { describe, expect, it, vi } from 'vitest'

import type { DiagnosticsTrace } from '../diagnostics/logs'
import { exportDeveloperCalendarFixture } from './developer-calendar-export'

const { exportBookingCalendarMock } = vi.hoisted(() => ({
  exportBookingCalendarMock: vi.fn(async () => 'shared' as const),
}))

vi.mock('../calendar/booking-calendar-export', () => ({
  exportBookingCalendar: exportBookingCalendarMock,
}))

describe('developer-calendar-export', () => {
  it('records standalone mode, calendar export diagnostics, and the final result', async () => {
    const trace = {
      append: vi.fn(),
      traceId: 'developer-calendar-export-trace',
    } satisfies DiagnosticsTrace
    const diagnostics = {
      beginTrace: vi.fn(() => trace),
    }
    exportBookingCalendarMock.mockImplementationOnce(
      async (_selections, _bookingIdentifier, observer) => {
        observer?.({
          type: 'calendar-export-prepared',
          fileName: 'laguuni-booking-developer-calendar-export.ics',
          fileSize: 100,
          fileType: 'text/calendar;charset=utf-8',
          selectionCount: 2,
        })
        observer?.({ type: 'share-result', result: 'shared' })

        return 'shared'
      },
    )

    await expect(exportDeveloperCalendarFixture(diagnostics)).resolves.toBe(
      'shared',
    )

    expect(diagnostics.beginTrace).toHaveBeenCalledWith({
      name: 'developer.calendar_export',
    })
    expect(trace.append).toHaveBeenNthCalledWith(1, {
      event: 'developer.calendar_export_standalone_mode',
      data: { standalone: expect.any(Boolean) },
    })
    expect(trace.append).toHaveBeenNthCalledWith(2, {
      event: 'developer.calendar_export_calendar_export_prepared',
      data: {
        fileName: 'laguuni-booking-developer-calendar-export.ics',
        fileSize: 100,
        fileType: 'text/calendar;charset=utf-8',
        selectionCount: 2,
      },
    })
    expect(trace.append).toHaveBeenNthCalledWith(3, {
      event: 'developer.calendar_export_share_result',
      data: { result: 'shared' },
    })
    expect(trace.append).toHaveBeenLastCalledWith({
      event: 'developer.calendar_export_result',
      data: { result: 'shared' },
    })

    expect(exportBookingCalendarMock).toHaveBeenCalledWith(
      [
        {
          cableId: 'pro',
          date: '2026-05-20',
          endTime: '16:00',
          startTime: '15:00',
        },
        {
          cableId: 'easy',
          date: '2026-05-21',
          endTime: '11:00',
          startTime: '10:00',
        },
      ],
      'developer-calendar-export',
      expect.any(Function),
    )
  })
})

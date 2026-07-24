import { toLocalDateString } from '../../lib/date'
import { isStandaloneMode } from '../../lib/standalone-mode'
import { exportBookingCalendar } from '../calendar/booking-calendar-export'
import type { Diagnostics } from '../diagnostics/logs'

const DEVELOPER_CALENDAR_SELECTIONS = [
  {
    cableId: 'pro',
    date: toLocalDateString('2026-05-20'),
    endTime: '16:00',
    startTime: '15:00',
  },
  {
    cableId: 'easy',
    date: toLocalDateString('2026-05-21'),
    endTime: '11:00',
    startTime: '10:00',
  },
] as const

export async function exportDeveloperCalendarFixture(diagnostics: Diagnostics) {
  const trace = diagnostics.beginTrace({ name: 'developer.calendar_export' })
  trace.append({
    event: 'developer.calendar_export_standalone_mode',
    data: { standalone: isStandaloneMode() },
  })

  const result = await exportBookingCalendar(
    DEVELOPER_CALENDAR_SELECTIONS,
    'developer-calendar-export',
    (calendarEvent) => {
      const { type, ...data } = calendarEvent
      trace.append({
        event: `developer.calendar_export_${type.replaceAll('-', '_')}`,
        data,
      })
    },
  )

  trace.append({
    event: 'developer.calendar_export_result',
    data: { result },
  })

  return result
}

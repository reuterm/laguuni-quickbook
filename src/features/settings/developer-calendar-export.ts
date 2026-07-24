import { localDate } from '../../../tests/local-date'
import { exportBookingCalendar } from '../calendar/booking-calendar-export'

const DEVELOPER_CALENDAR_SELECTIONS = [
  {
    cableId: 'pro',
    date: localDate('2026-05-20'),
    endTime: '16:00',
    startTime: '15:00',
  },
  {
    cableId: 'easy',
    date: localDate('2026-05-21'),
    endTime: '11:00',
    startTime: '10:00',
  },
] as const

export function exportDeveloperCalendarFixture() {
  return exportBookingCalendar(
    DEVELOPER_CALENDAR_SELECTIONS,
    'developer-calendar-export',
  )
}

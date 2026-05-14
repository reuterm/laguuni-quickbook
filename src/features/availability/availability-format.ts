import { parseLocalDate } from '../../lib/date'

export function createAnchorDate(referenceDate: Date): string {
  const year = referenceDate.getFullYear()
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0')
  const day = String(referenceDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(parseLocalDate(date))
}

export function formatMinuteOfDay(minuteOfDay: number): string {
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

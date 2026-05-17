import {
  addDays as addDaysLib,
  addWeeks as addWeeksLib,
  format as formatLib,
  startOfDay as startOfDayLib,
  startOfWeek as startOfWeekLib,
} from 'date-fns'

export type LocalDateString = string & { readonly __brand: 'LocalDateString' }

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/

export function isLocalDateString(value: string): value is LocalDateString {
  if (!localDatePattern.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)

  if (year === undefined || month === undefined || day === undefined) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00`)

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  )
}

export function toLocalDateString(value: string): LocalDateString {
  if (!isLocalDateString(value)) {
    throw new Error(`Date must be YYYY-MM-DD, received "${value}"`)
  }

  return value
}

export function parseLocalDate(date: LocalDateString): Date {
  return new Date(`${date}T00:00:00`)
}

export function formatLocalDate(date: Date): LocalDateString {
  return toLocalDateString(formatLib(date, 'yyyy-MM-dd'))
}

export function setDate(
  date: LocalDateString,
  dayOfMonth: number,
): LocalDateString {
  const nextDate = parseLocalDate(date)
  nextDate.setDate(dayOfMonth)

  return formatLocalDate(nextDate)
}

export function addDays(date: Date, amount: number): Date {
  return addDaysLib(date, amount)
}

export function addCalendarDays(date: Date, amount: number): Date {
  return addDays(startOfDay(date), amount)
}

export function addWeeks(date: Date, amount: number): Date {
  return addWeeksLib(date, amount)
}

export function format(date: Date, formatString: string): string {
  return formatLib(date, formatString)
}

export function startOfDay(date: Date): Date {
  return startOfDayLib(date)
}

export function startOfWeek(date: Date): Date {
  return startOfWeekLib(date, { weekStartsOn: 1 })
}

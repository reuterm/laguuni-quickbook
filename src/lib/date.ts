import {
  addDays as addDaysLib,
  addWeeks as addWeeksLib,
  type DateArg,
  format as formatLib,
  startOfDay as startOfDayLib,
  startOfWeek as startOfWeekLib,
} from 'date-fns'

export function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

export function addDays<
  DateType extends Date,
  ResultDate extends Date = DateType,
>(date: DateArg<DateType>, amount: number): ResultDate {
  return addDaysLib<DateType, ResultDate>(date, amount)
}

export function addWeeks<
  DateType extends Date,
  ResultDate extends Date = DateType,
>(date: DateArg<DateType>, amount: number): ResultDate {
  return addWeeksLib<DateType, ResultDate>(date, amount)
}

export function format(date: DateArg<Date> & {}, formatString: string): string {
  return formatLib(date, formatString)
}

export function startOfDay<
  DateType extends Date,
  ResultDate extends Date = DateType,
>(date: DateArg<DateType>): ResultDate {
  return startOfDayLib<DateType, ResultDate>(date)
}

export function startOfWeek<
  DateType extends Date,
  ResultDate extends Date = DateType,
>(date: DateArg<DateType>): ResultDate {
  return startOfWeekLib<DateType, ResultDate>(date, { weekStartsOn: 1 })
}

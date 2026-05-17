import { type LocalDateString, toLocalDateString } from '../src/lib/date'

export function localDate(value: string): LocalDateString {
  return toLocalDateString(value)
}

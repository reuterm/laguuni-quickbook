export function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

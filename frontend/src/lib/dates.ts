export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Parses the YYYY-MM-DD prefix of a stored date as a local calendar day. */
export function parseDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function todayIso(): string {
  const d = startOfToday()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysBetween(from: string, to: Date): number {
  return Math.round((to.getTime() - parseDate(from).getTime()) / 86_400_000)
}

/** "14 Sep" */
export function dayMonth(value: string): string {
  const d = parseDate(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "14 Sep 2026" */
export function fullDate(value: string): string {
  const d = parseDate(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "Sep 2026" */
export function monthYear(value: string): string {
  const d = parseDate(value)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "Tue 13 Oct 2026" */
export function todayLabel(): string {
  const d = startOfToday()
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

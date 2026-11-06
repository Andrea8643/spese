const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const eur0 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export const fmt = (n: number) => eur.format(round2(n))
export const fmt0 = (n: number) => eur0.format(Math.round(n))
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
export const WEEKDAYS_SHORT = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d || 1)
}
export const todayISO = () => toISO(new Date())
export const monthOf = (iso: string) => iso.slice(0, 7)
export const currentMonth = () => monthOf(todayISO())

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export function monthLabel(month: string, withYear = true): string {
  const [y, m] = month.split('-').map(Number)
  const name = MONTHS[m - 1]
  return withYear ? `${cap(name)} ${y}` : cap(name)
}
export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = []
  let m = from
  let guard = 0
  while (m <= to && guard++ < 600) {
    out.push(m)
    m = addMonths(m, 1)
  }
  return out
}

/** lunedì della settimana che contiene iso */
export function weekStart(iso: string): string {
  const d = parseISO(iso)
  const wd = (d.getDay() + 6) % 7 // 0 = lunedì
  d.setDate(d.getDate() - wd)
  return toISO(d)
}
export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export function weekLabel(start: string): string {
  const end = addDays(start, 6)
  const s = parseISO(start)
  const e = parseISO(end)
  const sm = MONTHS[s.getMonth()].slice(0, 3)
  const em = MONTHS[e.getMonth()].slice(0, 3)
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} ${em}`
    : `${s.getDate()} ${sm} – ${e.getDate()} ${em}`
}
export function dayLabel(iso: string): string {
  const d = parseISO(iso)
  const t = todayISO()
  if (iso === t) return 'Oggi'
  if (iso === addDays(t, -1)) return 'Ieri'
  const wd = WEEKDAYS_SHORT[(d.getDay() + 6) % 7]
  return `${cap(wd)} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9&]+/g, ' ')
    .trim()
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** "12,50" | "12.5" -> 12.5 */
export function parseAmount(s: string): number {
  const clean = s.replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : NaN
}

/** rimuove le chiavi undefined (Firestore non le accetta) */
export function clean<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}

// Calendar-date helpers. ISO dates are parsed as UTC day numbers so that
// no timezone can shift a bar by one day.

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const MONTHS_TH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const DAY = 86_400_000

export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY
}

export function isoFromDay(n: number): string {
  return new Date(n * DAY).toISOString().slice(0, 10)
}

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

/** "30 ก.ย. 2026" — Thai month, CE year, consistent everywhere. */
export function fmtDate(iso: string, withYear = true): string {
  const { y, m, d } = parts(iso)
  return `${d} ${MONTHS_TH[m - 1]}${withYear ? ` ${y}` : ''}`
}

export function fmtRange(start: string, end: string): string {
  const a = parts(start)
  const b = parts(end)
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS_TH[a.m - 1]} ${a.y}`
  return `${fmtDate(start, a.y !== b.y)} – ${fmtDate(end)}`
}

export function fmtLong(iso: string): string {
  const { y, m, d } = parts(iso)
  return `${d} ${MONTHS_TH_FULL[m - 1]} ${y}`
}

export const monthShort = (m: number) => MONTHS_TH[m - 1]

/** Inclusive number of calendar days. */
export const spanDays = (start: string, end: string) => dayNumber(end) - dayNumber(start) + 1

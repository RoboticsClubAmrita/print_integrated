/** Formatting helpers mirroring the Flutter app's intl usage. */

/** AppUser.initials: '?' when empty; one word → first letter; else first+last initials. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function hour12(d: Date): { h: number; ampm: 'AM' | 'PM' } {
  const h24 = d.getHours()
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return { h, ampm }
}

/** "Aug 12" (DateFormat 'MMM d'). */
export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "Aug 12, 4:30 PM" (DateFormat 'MMM d, h:mm a'). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const { h, ampm } = hour12(d)
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${h}:${mm} ${ampm}`
}

/** "Aug 12 • 4:30 PM" (DateFormat 'MMM d • h:mm a' — the print-time chip). */
export function formatDateTimeDot(iso: string): string {
  const d = new Date(iso)
  const { h, ampm } = hour12(d)
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${MONTHS[d.getMonth()]} ${d.getDate()} • ${h}:${mm} ${ampm}`
}

/** "Aug 12, 2026" (DateFormat 'MMM d, yyyy' — payment history). */
export function formatDayDate(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** Relative time for the notifications list. */
export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return formatDateShort(iso)
}

/** "0:30" resend-countdown format (m:ss). */
export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function fileExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

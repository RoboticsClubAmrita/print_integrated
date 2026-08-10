/**
 * Client-only prefs (remembered email, walkthrough seen, last-seen
 * notifications) under `pe.v1.prefs`, plus a small id-generator used by the
 * in-memory pre-upload file registry (`fileService.ts`). Orders/penalties/
 * notifications themselves come from the real backend — see `appStore.ts`.
 */
import type { Prefs } from '@/types'

const PREFS_KEY = 'pe.v1.prefs'

export function uid(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

const DEFAULT_PREFS: Prefs = {
  rememberedEmail: null,
  tourSeen: false,
  tourSeenUserIds: [],
  lastSeenNotificationsAt: null,
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(patch: Partial<Prefs>): Prefs {
  const next = { ...loadPrefs(), ...patch }
  localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  return next
}

/* ————— first-run walkthrough, per account ————— */

/**
 * Has this account already had its one walkthrough?
 *
 * Keyed by user id rather than by device: a shared browser in a lab would
 * otherwise let the first person's dismissal hide the tour from everyone
 * who signs in afterwards.
 *
 * Returns true when the user is unknown — better to show nothing than to
 * run a tour we cannot attribute (and would re-run on the next render).
 */
export function hasSeenTour(userId: string | null | undefined): boolean {
  if (!userId) return true

  const prefs = loadPrefs()
  if (prefs.tourSeenUserIds.includes(userId)) return true

  // One-time migration off the old device-wide flag: whoever is signed in
  // when this first runs is the person who dismissed it, so credit them and
  // retire the flag. Every other account still gets its own first run.
  if (prefs.tourSeen && prefs.tourSeenUserIds.length === 0) {
    savePrefs({ tourSeen: false, tourSeenUserIds: [userId] })
    return true
  }

  return false
}

export function markTourSeenFor(userId: string | null | undefined): void {
  if (!userId) return

  const prefs = loadPrefs()
  if (prefs.tourSeenUserIds.includes(userId)) return

  savePrefs({ tourSeenUserIds: [...prefs.tourSeenUserIds, userId] })
}

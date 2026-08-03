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

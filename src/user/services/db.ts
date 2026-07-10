/**
 * localStorage-backed mock database for orders/penalties/notifications.
 * Single JSON document under `pe.v1.db`, prefs under `pe.v1.prefs`.
 * Corrupt or version-mismatched data is wiped and reseeded.
 *
 * The real session (auth token + user) is NOT stored here — it lives at
 * the canonical `localStorage.token`/`localStorage.user` keys shared with
 * the admin console (see `src/services/api.js`), so both interfaces agree
 * on who's logged in without a second login.
 */
import type { Db, Prefs } from '@/types'
import { DEMO_EMAIL, seedDb } from '@/services/seed'

export const SCHEMA_VERSION = 1

const DB_KEY = 'pe.v1.db'
const PREFS_KEY = 'pe.v1.prefs'

let cache: Db | null = null

export function uid(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function loadDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Db
      if (parsed && parsed.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.orders)) {
        // Lazy migration: the demo account gained the ADMIN role after v1
        // databases were already seeded — patch it in place instead of wiping.
        const demo = parsed.users.find((u) => u.email === DEMO_EMAIL)
        if (demo && demo.role !== 'ADMIN') {
          demo.role = 'ADMIN'
          localStorage.setItem(DB_KEY, JSON.stringify(parsed))
        }
        return parsed
      }
    }
  } catch {
    // corrupt JSON — fall through to reseed
  }
  const fresh = seedDb()
  localStorage.setItem(DB_KEY, JSON.stringify(fresh))
  return fresh
}

export function getDb(): Db {
  if (!cache) cache = loadDb()
  return cache
}

export function saveDb(): void {
  if (cache) localStorage.setItem(DB_KEY, JSON.stringify(cache))
}

/** Wipe the local orders/penalties/notifications sandbox and reseed it. Does not touch the real session. */
export function resetDb(): void {
  cache = seedDb()
  localStorage.setItem(DB_KEY, JSON.stringify(cache))
}

// ————— Prefs —————

const DEFAULT_PREFS: Prefs = {
  rememberedEmail: null,
  walkthroughSeen: false,
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

/**
 * Global app state (session, user, orders, penalties, locations).
 * `session`/`user` hydrate synchronously from the session store (local or
 * (written by the real backend login — see `src/services/api.js`) so route
 * guards never flash. Orders/penalties/locations are fetched from the real
 * Postgres-backed API (`refresh()`/`loadLocations()`), called from
 * `AppShell` on mount/user-change and after every mutation.
 */
import { create } from 'zustand'
import type { AppNotification, Order, Penalty, PrintLocation, Session, User } from '@/types'
import { hasSeenTour, loadPrefs, markTourSeenFor, savePrefs } from '@/services/db'
import { jobToOrder, locationToPrintLocation, penaltyToPenalty } from '@/lib/adapters'
import { isPaid, orderCost } from '@/lib/orders'
import { isToday } from '@/lib/format'
import { withRetry } from '@/lib/apiError'
import { jobService, penaltyService, hardwareService } from '../../services/api'
import { getStoredUser, getToken, isPersistent } from '../../services/tokenStore'

export const DEMO_JOB_ID = 'demo-job'

interface AppState {
  session: Session | null
  user: User | null
  orders: Order[]
  penalties: Penalty[]
  notifications: AppNotification[]
  locations: PrintLocation[]
  selectedLocationId: string | null
  tourSeen: boolean
  /** Bumped to ask the shell to replay the walkthrough from step 1. */
  tourReplays: number
  demoMode: boolean
  lastSeenNotificationsAt: string | null

  /** Re-pull the current user's orders/penalties from the real backend. */
  refresh: () => Promise<void>
  /** Fetch the live print-hub list (rarely changes; called once per session). */
  loadLocations: () => Promise<void>
  setSession: (session: Session | null) => void
  /** Overwrite the in-memory user (e.g. after a profile edit re-fetch). */
  setUser: (user: User) => void
  setSelectedLocation: (id: string | null) => void
  markTourSeen: () => void
  /** Replay the walkthrough on demand (Profile → About PrintEase). */
  replayTour: () => void
  setDemoMode: (v: boolean) => void
  injectDemoOrder: (order: Order) => void
  removeDemoOrder: () => void
  markNotificationsSeen: () => void
  clear: () => void
}

/** Reads the real authenticated user, from whichever store the session chose. */
function realUser(): User | null {
  try {
    const raw = getStoredUser()
    if (!raw) return null
    const u = JSON.parse(raw)
    const id = u?._id ?? u?.id
    if (!id || !u?.role) return null
    return {
      id,
      collegeId: u.collegeId ?? '',
      name: u.name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      password: '',
      role: u.role,
      balance: u.balance ?? 0,
    }
  } catch {
    return null
  }
}

function hydrate() {
  const prefs = loadPrefs()
  const base = {
    orders: [] as Order[],
    penalties: [] as Penalty[],
    notifications: [] as AppNotification[],
    locations: [] as PrintLocation[],
    selectedLocationId: null as string | null,
    tourSeen: true, // replaced below once the restored user is known
    tourReplays: 0,
    demoMode: false,
    lastSeenNotificationsAt: prefs.lastSeenNotificationsAt,
  }
  const token = getToken()
  const user = token ? realUser() : null
  if (!token || !user) {
    return { ...base, session: null, user: null }
  }
  base.tourSeen = hasSeenTour(user.id)
  const session: Session = {
    userId: user.id,
    token,
    rememberMe: isPersistent(),
    createdAt: new Date().toISOString(),
  }
  return { ...base, session, user }
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...hydrate(),

  refresh: async () => {
    const user = get().user
    if (!user) return
    const locations = get().locations
    // Reads are safe to repeat, so a dropped connection retries rather than
    // leaving the app showing an empty order list as if nothing were there.
    const [jobsRes, penaltiesRes] = await Promise.all([
      withRetry(() => jobService.getByUser(user.id, { limit: 100 })),
      withRetry(() => penaltyService.getForUser(user.id)),
    ])
    const jobsData = jobsRes?.DATA ?? jobsRes
    const penaltiesData = penaltiesRes?.DATA ?? penaltiesRes
    const orders = (jobsData?.jobs ?? [])
      .map((j: Parameters<typeof jobToOrder>[0]) => jobToOrder(j, locations))
      .sort((a: Order, b: Order) => (a.createdAt < b.createdAt ? 1 : -1))
    const penalties = (penaltiesData?.penalties ?? []).map(penaltyToPenalty)
    // Current user may have changed (or logged out) while the requests were in flight.
    if (get().user?.id !== user.id) return
    set({ orders, penalties })
  },

  loadLocations: async () => {
    const res = await hardwareService.getLocations()
    const data = res?.DATA ?? res
    const locations = (Array.isArray(data) ? data : []).map(locationToPrintLocation)
    set({ locations })
    // Re-resolve locationName on already-loaded orders now that locations are known.
    const orders = get().orders
    if (orders.length) {
      set({ orders: orders.map((o) => ({ ...o, locationName: locations.find((l) => l.id === o.locationId)?.name ?? o.locationName })) })
    }
  },

  setSession: (session) => {
    if (!session) {
      set({ session: null, user: null, orders: [], penalties: [], notifications: [] })
      return
    }
    const user = realUser()
    set({ session, user, orders: [], penalties: [], tourSeen: hasSeenTour(user?.id) })
  },

  setUser: (user) => set({ user }),

  setSelectedLocation: (id) => set({ selectedLocationId: id }),

  markTourSeen: () => {
    markTourSeenFor(get().user?.id)
    set({ tourSeen: true })
  },

  replayTour: () => set((s) => ({ tourReplays: s.tourReplays + 1 })),

  setDemoMode: (v) => set({ demoMode: v }),

  injectDemoOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

  removeDemoOrder: () =>
    set((s) => ({ orders: s.orders.filter((o) => o.jobId !== DEMO_JOB_ID) })),

  markNotificationsSeen: () => {
    const now = new Date().toISOString()
    savePrefs({ lastSeenNotificationsAt: now })
    set({ lastSeenNotificationsAt: now })
  },

  clear: () =>
    set({
      session: null,
      user: null,
      orders: [],
      penalties: [],
      notifications: [],
      selectedLocationId: null,
    }),
}))

// A refresh-token failure (see src/services/api.js) clears localStorage and
// fires this event from outside React — drop the in-memory session too so
// route guards redirect to /login instead of showing stale data.
window.addEventListener('auth:sessionExpired', () => {
  useAppStore.getState().clear()
})

// ————— Derived helpers (pure — call with store slices) —————

export const activeOrders = (orders: Order[]) => orders.filter((o) => o.status !== 'COLLECTED')
export const historyOrders = (orders: Order[]) => orders.filter((o) => o.status === 'COLLECTED')
export const todayOrders = (orders: Order[]) => orders.filter((o) => isToday(o.createdAt))
/** Quirk preserved from the Flutter app: includes CANCELLED and FAILED. */
export const unpaidOrders = (orders: Order[]) => orders.filter((o) => !isPaid(o.status))
export const paidOrders = (orders: Order[]) => orders.filter((o) => isPaid(o.status))
export const totalDue = (orders: Order[]) =>
  unpaidOrders(orders).reduce((sum, o) => sum + orderCost(o), 0)
export const totalSpent = (orders: Order[]) =>
  paidOrders(orders).reduce((sum, o) => sum + orderCost(o), 0)
export const penaltyRemaining = (p: Penalty) => Math.round(p.amount - p.settledAmount)
export const outstandingDues = (penalties: Penalty[]) =>
  penalties.reduce((sum, p) => sum + Math.max(0, penaltyRemaining(p)), 0)
export const unreadCount = (notifications: AppNotification[], lastSeen: string | null) =>
  notifications.filter((n) => !lastSeen || n.time > lastSeen).length

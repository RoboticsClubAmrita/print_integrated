/**
 * Global app state (session, user, orders, penalties, notifications).
 * Hydrates synchronously from localStorage at module import so route guards
 * never flash, and is callable from the simulation engine outside React.
 *
 * `user` is the REAL authenticated identity (from `localStorage.user`,
 * written by the real backend login — see `src/services/api.js`), not a
 * mock-db lookup: the admin console and this app share one login. Orders/
 * penalties/notifications stay sourced from the local mock db keyed by that
 * same real user id — legitimately empty for a fresh account, populated by
 * this app's own (still-mocked) New Order flow from then on.
 */
import { create } from 'zustand'
import type {
  AppNotification,
  Order,
  Penalty,
  PrintLocation,
  Session,
  User,
} from '@/types'
import { getDb, loadPrefs, savePrefs } from '@/services/db'
import { LOCATIONS } from '@/services/seed'
import { isPaid, orderCost } from '@/lib/orders'
import { isToday } from '@/lib/format'

interface AppState {
  session: Session | null
  user: User | null
  orders: Order[]
  penalties: Penalty[]
  notifications: AppNotification[]
  locations: PrintLocation[]
  selectedLocationId: string | null
  walkthroughSeen: boolean
  lastSeenNotificationsAt: string | null

  /** Re-pull the current user's slices from the mock db. */
  refresh: () => void
  setSession: (session: Session | null) => void
  setSelectedLocation: (id: string | null) => void
  markWalkthroughSeen: () => void
  markNotificationsSeen: () => void
  clear: () => void
}

/** Reads the real authenticated user (written by the real login) directly from localStorage. */
function realUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
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

function orderSlices(userId: string) {
  const db = getDb()
  const orders = db.orders
    .filter((o) => o.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const penalties = db.penalties.filter((p) => p.userId === userId)
  const notifications = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => (a.time < b.time ? 1 : -1))
  return { orders, penalties, notifications }
}

function hydrate() {
  const prefs = loadPrefs()
  const base = {
    locations: LOCATIONS,
    selectedLocationId: null as string | null,
    walkthroughSeen: prefs.walkthroughSeen,
    lastSeenNotificationsAt: prefs.lastSeenNotificationsAt,
  }
  const token = localStorage.getItem('token')
  const user = token ? realUser() : null
  if (!token || !user) {
    return { ...base, session: null, user: null, orders: [], penalties: [], notifications: [] }
  }
  const session: Session = {
    userId: user.id,
    token,
    rememberMe: true,
    createdAt: new Date().toISOString(),
  }
  return { ...base, session, user, ...orderSlices(user.id) }
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...hydrate(),

  refresh: () => {
    const user = get().user
    if (!user) return
    set({ user, ...orderSlices(user.id) })
  },

  setSession: (session) => {
    if (!session) {
      set({ session: null, user: null, orders: [], penalties: [], notifications: [] })
      return
    }
    const user = realUser()
    set({
      session,
      user,
      ...(user ? orderSlices(user.id) : { orders: [], penalties: [], notifications: [] }),
    })
  },

  setSelectedLocation: (id) => set({ selectedLocationId: id }),

  markWalkthroughSeen: () => {
    savePrefs({ walkthroughSeen: true })
    set({ walkthroughSeen: true })
  },

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

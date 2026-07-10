/**
 * The status-progression engine that replaces the print backend.
 *
 * Started once from main.tsx — outside React, so StrictMode double-effects
 * can't duplicate it (a global flag also survives HMR re-evaluation).
 * Deadlines are persisted per order (`nextTransitionAt`), so progressions
 * survive reloads; a startup catch-up applies overdue transitions but
 * notifies only the final status per order (no toast spam after time away).
 *
 * Pipeline: QUEUED → PRINTING (+20s dwell set on entry to QUEUED)
 *           PRINTING → PRINTED_PENDING_STACK (+35s)
 *           PRINTED_PENDING_STACK → COMPLETED (+25s, stack assigned, then
 *           waits for human collection). SCHEDULED → QUEUED at scheduledFor.
 */
import type { Order, OrderStatus } from '@/types'
import { getDb, saveDb } from '@/services/db'
import { recordTransitionNotification } from '@/services/notify'
import { useAppStore } from '@/store/appStore'

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  QUEUED: 'PRINTING',
  PRINTING: 'PRINTED_PENDING_STACK',
  PRINTED_PENDING_STACK: 'COMPLETED',
}

/** Dwell before the following transition, keyed by the status just entered. */
const DWELL_AFTER: Partial<Record<OrderStatus, number>> = {
  QUEUED: 20_000,
  PRINTING: 35_000,
  PRINTED_PENDING_STACK: 25_000,
}

const STACKS = ['A', 'B', 'C', 'D']
let stackCursor = 0

function dueAt(order: Order): number | null {
  if (order.status === 'SCHEDULED') {
    return order.scheduledFor ? Date.parse(order.scheduledFor) : null
  }
  if (NEXT[order.status] && order.nextTransitionAt) {
    return Date.parse(order.nextTransitionAt)
  }
  return null
}

/** Applies one transition; chains the next deadline off the due time. */
function applyTransition(order: Order, atMs: number): { from: OrderStatus; to: OrderStatus } {
  const from = order.status
  const to: OrderStatus = order.status === 'SCHEDULED' ? 'QUEUED' : NEXT[order.status]!
  order.status = to
  if (to === 'COMPLETED') {
    order.stackName = STACKS[stackCursor++ % STACKS.length]
    order.nextTransitionAt = null
  } else {
    const dwell = DWELL_AFTER[to]
    order.nextTransitionAt = dwell ? new Date(atMs + dwell).toISOString() : null
  }
  return { from, to }
}

function tick(): void {
  const now = Date.now()
  const db = getDb()
  const events: { order: Order; from: OrderStatus; to: OrderStatus }[] = []
  for (const order of db.orders) {
    const due = dueAt(order)
    if (due !== null && now >= due) {
      events.push({ order, ...applyTransition(order, due) })
    }
  }
  if (events.length > 0) {
    saveDb()
    for (const e of events) recordTransitionNotification(e.order, e.from, e.to)
    useAppStore.getState().refresh()
  }
}

/** Applies everything overdue, notifying only each order's final status. */
function catchUp(): void {
  const db = getDb()
  const finals = new Map<string, { order: Order; from: OrderStatus; to: OrderStatus }>()
  for (let guard = 0; guard < 100; guard++) {
    const now = Date.now()
    let any = false
    for (const order of db.orders) {
      const due = dueAt(order)
      if (due !== null && now >= due) {
        const prior = finals.get(order.jobId)
        const ev = applyTransition(order, due)
        finals.set(order.jobId, {
          order,
          from: prior ? prior.from : ev.from,
          to: ev.to,
        })
        any = true
      }
    }
    if (!any) break
  }
  if (finals.size > 0) {
    saveDb()
    for (const e of finals.values()) recordTransitionNotification(e.order, e.from, e.to)
    useAppStore.getState().refresh()
  }
}

export function startSimulation(): void {
  const g = globalThis as typeof globalThis & { __peSimRunning?: boolean }
  if (g.__peSimRunning) return
  g.__peSimRunning = true
  catchUp()
  setInterval(tick, 1000)
}

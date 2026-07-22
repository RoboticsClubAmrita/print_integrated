/**
 * Status-transition toast. The backend has no notifications table, so
 * unlike the old mock this no longer persists a bell-list entry — it only
 * surfaces a toast for a transition the current tab just observed (e.g.
 * right after `confirmCollection`).
 */
import type { Order, OrderStatus } from '@/types'
import { transitionNotification } from '@/lib/orders'
import { toast } from '@/store/uiStore'

export function recordTransitionNotification(order: Order, from: OrderStatus, to: OrderStatus): void {
  const copy = transitionNotification(order.fileName, from, to)
  if (!copy) return
  const tone = to === 'COMPLETED' || to === 'COLLECTED' ? 'success' : 'info'
  toast(copy.title, copy.body, tone)
}

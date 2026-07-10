/**
 * Records a status-transition notification (bell list entry + toast),
 * mirroring AppState._notifyStatusChanges in the Flutter app.
 */
import type { Order, OrderStatus } from '@/types'
import { transitionNotification } from '@/lib/orders'
import { getDb, saveDb, uid } from '@/services/db'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/uiStore'

export function recordTransitionNotification(
  order: Order,
  from: OrderStatus,
  to: OrderStatus,
  opts: { withToast?: boolean } = {},
): void {
  const copy = transitionNotification(order.fileName, from, to)
  if (!copy) return
  const db = getDb()
  db.notifications.unshift({
    id: uid('n'),
    userId: order.userId,
    title: copy.title,
    body: copy.body,
    time: new Date().toISOString(),
  })
  saveDb()
  const session = useAppStore.getState().session
  if (opts.withToast !== false && session?.userId === order.userId) {
    const tone = to === 'COMPLETED' || to === 'COLLECTED' ? 'success' : 'info'
    toast(copy.title, copy.body, tone)
  }
}

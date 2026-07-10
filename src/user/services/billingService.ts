/** Payment flows: per-order, pay-all-due (sequential chain), and dues. */
import type { Order } from '@/types'
import { orderCost } from '@/lib/orders'
import { outstandingDues } from '@/store/appStore'
import { checkout } from '@/services/paymentService'
import { markPaid } from '@/services/orderService'
import { getDb, saveDb } from '@/services/db'
import { useAppStore } from '@/store/appStore'

/** Single-order payment (order detail "Pay ₹X"). */
export async function payOrder(order: Order): Promise<void> {
  await checkout({
    title: 'PrintEase',
    description: `Print job ${order.id}`,
    amount: orderCost(order),
  })
  markPaid(order.jobId)
}

/**
 * Billing "Pay Now": walks every payable (PENDING) order sequentially,
 * aborting the chain if a checkout is cancelled or fails.
 * Returns the total amount cleared.
 */
export async function payAllDue(): Promise<number> {
  const pending = useAppStore
    .getState()
    .orders.filter((o) => o.status === 'PENDING')
  let cleared = 0
  for (let i = 0; i < pending.length; i++) {
    const order = pending[i]
    await checkout({
      title: 'PrintEase',
      description: `Print job ${order.id}`,
      amount: orderCost(order),
      step: pending.length > 1 ? { current: i + 1, total: pending.length } : undefined,
    })
    markPaid(order.jobId)
    cleared += orderCost(order)
  }
  return cleared
}

/** Billing "Pay Dues": settles the storage-penalty ledger. */
export async function payOutstandingDues(): Promise<number> {
  const state = useAppStore.getState()
  if (!state.user) throw new Error('Not signed in')
  const amount = outstandingDues(state.penalties)
  if (amount <= 0) return 0
  await checkout({
    title: 'PrintEase',
    description: 'Outstanding dues',
    amount,
  })
  const db = getDb()
  for (const p of db.penalties) {
    if (p.userId === state.user.id) p.settledAmount = p.amount
  }
  saveDb()
  state.refresh()
  return amount
}

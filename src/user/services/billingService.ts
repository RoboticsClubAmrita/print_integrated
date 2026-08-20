/**
 * Payment flows: per-order, pay-all-due (sequential), and outstanding dues.
 *
 * Every one of them goes through Razorpay. The amount is decided by the
 * backend from the job it priced, and a payment only counts once the backend
 * has verified the gateway's signature — there is no path from this app that
 * marks anything paid without money moving. (`/payments/mark-paid` still
 * exists for cash handed over at the counter, but it is admin-only and this
 * app never calls it.)
 */
import type { Order } from '@/types'
import { outstandingDues, useAppStore } from '@/store/appStore'
import { payDues, payForJob } from '@/services/razorpay'
import { apiErrorMessage } from '@/lib/apiError'
import { flushPending, getPending } from '@/services/pendingUploads'

/**
 * Settles one job through the gateway. Throws PaymentError if it doesn't.
 *
 * @returns the amount the backend actually charged, in rupees. This can be
 * lower than `orderCost(order)`: an outstanding balance is rolled into every
 * unpaid order's total, and the backend re-prices against the balance still
 * owed at checkout time, so dues already settled are not charged again.
 */
async function settle(order: Order): Promise<number> {
  const user = useAppStore.getState().user
  const paid = await payForJob(order.jobId, {
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
  })
  return paid.amount
}

/**
 * Payment is what unlocks the upload: the document has been sitting on this
 * device since the order was placed. Sending it is what actually lets the job
 * print, so it runs as part of paying rather than being left to chance.
 *
 * A failure here is reported but does not undo the payment — the bytes stay
 * held locally and `resumePendingUploads` will finish the delivery.
 */
async function deliverDocumentFor(order: Order): Promise<string | null> {
  if (!order.fileId) return null

  const held = await getPending(order.fileId).catch(() => undefined)
  if (!held) return null

  try {
    const sent = await flushPending(held)
    return sent ? null : 'Your document is still being sent — it will finish automatically.'
  } catch (err) {
    return apiErrorMessage(err, 'The document could not be sent to the print server.')
  }
}

/**
 * Single-order payment (order detail "Pay ₹X").
 * @returns the amount actually charged, plus a note when the document could
 * not be delivered.
 */
export async function payOrder(
  order: Order,
): Promise<{ amountPaid: number; note: string | null }> {
  const amountPaid = await settle(order)
  const note = await deliverDocumentFor(order)
  await useAppStore.getState().refresh()
  return { amountPaid, note }
}

/**
 * Billing "Pay Now": settles every payable (PENDING) order, one checkout each.
 *
 * Sequential and deliberately not atomic — each order is its own Razorpay
 * payment. If the user abandons one, everything already paid stays paid and
 * the rest are left for next time, so the amount returned is what actually
 * cleared rather than what was owed.
 */
export async function payAllDue(): Promise<number> {
  const pending = useAppStore.getState().orders.filter((o) => o.status === 'PENDING')
  let cleared = 0
  try {
    for (const order of pending) {
      // Sum what was charged, not each order's cached total — every unpaid
      // order's total carries the same rolled-in balance, so adding those
      // would report the same dues once per order.
      cleared += await settle(order)
      await deliverDocumentFor(order)
    }
  } finally {
    await useAppStore.getState().refresh()
  }
  return cleared
}

/** Billing "Pay Dues": settles the storage-penalty ledger. */
export async function payOutstandingDues(): Promise<number> {
  const state = useAppStore.getState()
  if (!state.user) throw new Error('Not signed in')
  const amount = outstandingDues(state.penalties)
  if (amount <= 0) return 0
  await payDues(state.user.id, {
    name: state.user.name,
    email: state.user.email,
    phone: state.user.phone,
  })
  await useAppStore.getState().refresh()
  return amount
}

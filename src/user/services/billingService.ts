/**
 * Payment flows: per-order, pay-all-due (sequential), and outstanding dues.
 * Skips the Razorpay gateway entirely — the backend's mark-paid endpoints
 * apply the exact same job/penalty/balance effects a verified payment
 * would, so state stays in sync with the admin console either way.
 */
import type { Order } from '@/types'
import { orderCost } from '@/lib/orders'
import { outstandingDues, useAppStore } from '@/store/appStore'
import { paymentService as realPayments } from '../../services/api'
import { apiErrorMessage } from '@/lib/apiError'
import { flushPending, getPending } from '@/services/pendingUploads'

async function markJobPaid(order: Order): Promise<void> {
  try {
    await realPayments.markPaid(order.jobId)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Payment failed'))
  }
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
 * @returns a note when the document could not be delivered, else null.
 */
export async function payOrder(order: Order): Promise<string | null> {
  await markJobPaid(order)
  const note = await deliverDocumentFor(order)
  await useAppStore.getState().refresh()
  return note
}

/** Billing "Pay Now": marks every payable (PENDING) order paid. Returns the total amount cleared. */
export async function payAllDue(): Promise<number> {
  const pending = useAppStore.getState().orders.filter((o) => o.status === 'PENDING')
  let cleared = 0
  for (const order of pending) {
    await markJobPaid(order)
    await deliverDocumentFor(order)
    cleared += orderCost(order)
  }
  await useAppStore.getState().refresh()
  return cleared
}

/** Billing "Pay Dues": settles the storage-penalty ledger. */
export async function payOutstandingDues(): Promise<number> {
  const state = useAppStore.getState()
  if (!state.user) throw new Error('Not signed in')
  const amount = outstandingDues(state.penalties)
  if (amount <= 0) return 0
  try {
    await realPayments.markDuesPaid(state.user.id)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Payment failed'))
  }
  await useAppStore.getState().refresh()
  return amount
}

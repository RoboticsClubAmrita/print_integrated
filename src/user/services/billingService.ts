/** Payment flows: per-order, pay-all-due (sequential), and outstanding dues — real Razorpay + backend verify. */
import type { Order } from '@/types'
import { orderCost } from '@/lib/orders'
import { outstandingDues, useAppStore } from '@/store/appStore'
import { openCheckout } from '@/services/paymentService'
import { paymentService as realPayments } from '../../services/api'

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { MESSAGE?: string; message?: string } } }
  return e?.response?.data?.MESSAGE || e?.response?.data?.message || fallback
}

async function payForJob(order: Order): Promise<void> {
  const user = useAppStore.getState().user
  try {
    const createRes = await realPayments.createOrder({ jobId: order.jobId })
    const data = createRes?.DATA ?? createRes
    const result = await openCheckout({
      keyId: data.keyId,
      orderId: data.orderId,
      amountInPaise: data.amountInPaise,
      currency: data.currency,
      description: `Print job ${order.id}`,
      prefill: { name: user?.name, email: user?.email, contact: user?.phone },
    })
    await realPayments.verify(result)
  } catch (err) {
    throw new Error(apiErrorMessage(err, err instanceof Error ? err.message : 'Payment failed'))
  }
}

/** Single-order payment (order detail "Pay ₹X"). */
export async function payOrder(order: Order): Promise<void> {
  await payForJob(order)
  await useAppStore.getState().refresh()
}

/**
 * Billing "Pay Now": walks every payable (PENDING) order sequentially,
 * aborting the chain if a checkout is cancelled or fails.
 * Returns the total amount cleared.
 */
export async function payAllDue(): Promise<number> {
  const pending = useAppStore.getState().orders.filter((o) => o.status === 'PENDING')
  let cleared = 0
  for (const order of pending) {
    await payForJob(order)
    cleared += orderCost(order)
  }
  await useAppStore.getState().refresh()
  return cleared
}

/** Billing "Pay Dues": settles the storage-penalty ledger via a standalone Razorpay order. */
export async function payOutstandingDues(): Promise<number> {
  const state = useAppStore.getState()
  if (!state.user) throw new Error('Not signed in')
  const amount = outstandingDues(state.penalties)
  if (amount <= 0) return 0
  try {
    const createRes = await realPayments.createPenaltyOrder(state.user.id)
    const data = createRes?.DATA ?? createRes
    const result = await openCheckout({
      keyId: data.keyId,
      orderId: data.orderId,
      amountInPaise: data.amountInPaise,
      currency: data.currency,
      description: 'Outstanding dues',
      prefill: { name: state.user.name, email: state.user.email, contact: state.user.phone },
    })
    await realPayments.verify(result)
  } catch (err) {
    throw new Error(apiErrorMessage(err, err instanceof Error ? err.message : 'Payment failed'))
  }
  await useAppStore.getState().refresh()
  return amount
}

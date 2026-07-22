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

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { MESSAGE?: string; message?: string } } }
  return e?.response?.data?.MESSAGE || e?.response?.data?.message || fallback
}

async function markJobPaid(order: Order): Promise<void> {
  try {
    await realPayments.markPaid(order.jobId)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Payment failed'))
  }
}

/** Single-order payment (order detail "Pay ₹X"). */
export async function payOrder(order: Order): Promise<void> {
  await markJobPaid(order)
  await useAppStore.getState().refresh()
}

/** Billing "Pay Now": marks every payable (PENDING) order paid. Returns the total amount cleared. */
export async function payAllDue(): Promise<number> {
  const pending = useAppStore.getState().orders.filter((o) => o.status === 'PENDING')
  let cleared = 0
  for (const order of pending) {
    await markJobPaid(order)
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

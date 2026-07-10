/** Order lifecycle operations against the mock db. */
import type { Order, PrintSide } from '@/types'
import { delay } from '@/lib/delay'
import { printCost } from '@/lib/pricing'
import { getDb, saveDb, uid } from '@/services/db'
import { requestOtp, verifyOtp } from '@/services/otpService'
import { recordTransitionNotification } from '@/services/notify'
import { useAppStore } from '@/store/appStore'

const INVALID_OTP = 'Invalid code. Try again.'

function nextRef(): number {
  const db = getDb()
  let max = 1050
  for (const o of db.orders) {
    const m = /^PE-(\d+)$/.exec(o.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max + 1
}

export interface NewOrderInput {
  fileName: string
  fileSizeKb: number
  totalDocPages: number
  selectedPages: number[] | null
  copies: number
  side: PrintSide
  scheduledFor: string | null
  locationId: string | null
  locationName: string | null
}

export async function placeOrder(input: NewOrderInput): Promise<Order> {
  await delay(500)
  const state = useAppStore.getState()
  const user = state.user
  if (!user) throw new Error('Not signed in')

  const pages = input.selectedPages ? input.selectedPages.length : input.totalDocPages
  const cost = printCost({ pages, copies: input.copies, side: input.side })
  const order: Order = {
    id: `PE-${nextRef()}`,
    jobId: uid('job'),
    userId: user.id,
    fileName: input.fileName,
    fileSizeKb: input.fileSizeKb,
    pages,
    totalDocPages: input.totalDocPages,
    copies: input.copies,
    side: input.side,
    colorMode: 'BW',
    pageType: 'A4',
    selectedPages: input.selectedPages,
    createdAt: new Date().toISOString(),
    scheduleType: input.scheduledFor ? 'SCHEDULED' : 'NOW',
    scheduledFor: input.scheduledFor,
    status: 'PENDING',
    costPerPage: input.side === 'SINGLE' ? 2 : 3,
    printCost: cost,
    balanceApplied: 0,
    totalCost: cost,
    locationId: input.locationId,
    locationName: input.locationName,
    stackName: null,
    collectedStackName: null,
    nextTransitionAt: null,
  }
  const db = getDb()
  db.orders.unshift(order)
  saveDb()
  state.refresh()
  return order
}

/** After a successful payment: future-scheduled orders wait, others queue. */
export function markPaid(jobId: string): void {
  const db = getDb()
  const order = db.orders.find((o) => o.jobId === jobId)
  if (!order) return
  if (
    order.scheduleType === 'SCHEDULED' &&
    order.scheduledFor &&
    Date.parse(order.scheduledFor) > Date.now()
  ) {
    order.status = 'SCHEDULED'
    order.nextTransitionAt = null
  } else {
    order.status = 'QUEUED'
    order.nextTransitionAt = new Date(Date.now() + 20_000).toISOString()
  }
  saveDb()
  useAppStore.getState().refresh()
}

export async function cancelOrder(jobId: string): Promise<void> {
  await delay()
  const db = getDb()
  const order = db.orders.find((o) => o.jobId === jobId)
  if (!order) return
  order.status = 'CANCELLED'
  order.nextTransitionAt = null
  saveDb()
  useAppStore.getState().refresh()
}

/** Emails (mock) a collection OTP; returns the target email + demo code. */
export async function requestCollection(order: Order): Promise<{ email: string; code: string }> {
  await delay()
  const email = useAppStore.getState().user?.email ?? 'your email'
  return { email, code: requestOtp('collect', order.jobId) }
}

export async function confirmCollection(
  jobId: string,
  otp: string,
): Promise<{ error: string | null; stackName?: string }> {
  await delay()
  if (!verifyOtp('collect', jobId, otp)) return { error: INVALID_OTP }
  const db = getDb()
  const order = db.orders.find((o) => o.jobId === jobId)
  if (!order) return { error: 'Order not found.' }
  const from = order.status
  const stackName = order.stackName ?? 'A'
  order.collectedStackName = stackName
  order.status = 'COLLECTED'
  order.nextTransitionAt = null
  saveDb()
  // Bell entry, no toast — the success overlay covers the moment.
  recordTransitionNotification(order, from, 'COLLECTED', { withToast: false })
  useAppStore.getState().refresh()
  return { error: null, stackName }
}

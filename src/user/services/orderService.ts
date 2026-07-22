/** Order lifecycle: real file upload + print-job create/cancel/collect against the Postgres-backed API. */
import type { Order, PrintSide } from '@/types'
import { jobToOrder } from '@/lib/adapters'
import { useAppStore } from '@/store/appStore'
import { fileService as realFiles, jobService as realJobs } from '../../services/api'

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { MESSAGE?: string; message?: string } } }
  return e?.response?.data?.MESSAGE || e?.response?.data?.message || fallback
}

export interface NewOrderInput {
  file: File
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
  const state = useAppStore.getState()
  const user = state.user
  if (!user) throw new Error('Not signed in')

  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('userId', user.id)

  let fileId: string | undefined
  try {
    const uploadRes = await realFiles.upload(formData)
    fileId = (uploadRes?.DATA ?? uploadRes)?.fileId
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Could not upload the file.'))
  }
  if (!fileId) throw new Error('Could not upload the file.')

  const payload: Record<string, unknown> = {
    userId: user.id,
    fileId,
    printSide: input.side,
    copies: input.copies,
    // Server is the source of truth for the printed page count: the full
    // selection length, or the whole document when printing every page.
    totalPagesToPrint: input.selectedPages && input.selectedPages.length ? input.selectedPages.length : input.totalDocPages,
    currency: 'INR',
  }
  if (input.locationId) payload.locationId = input.locationId
  // The backend 400s on an explicit `selectedPages: null` (it must be a
  // non-empty array when the field is present at all) — only send it when
  // the user picked a subset of pages.
  if (input.selectedPages && input.selectedPages.length) payload.selectedPages = input.selectedPages
  if (input.scheduledFor) {
    payload.scheduleType = 'SCHEDULED'
    payload.scheduledFor = input.scheduledFor
  }

  let jobId: string | undefined
  try {
    const createRes = await realJobs.create(payload)
    jobId = (createRes?.DATA ?? createRes)?.jobId
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Could not place the order.'))
  }
  if (!jobId) throw new Error('Could not place the order.')

  const jobRes = await realJobs.getById(jobId)
  const job = jobRes?.DATA ?? jobRes
  const order = jobToOrder(job, state.locations)
  await state.refresh()
  return order
}

export async function cancelOrder(jobId: string, reason?: string): Promise<void> {
  await realJobs.cancel({ jobId, reason })
  await useAppStore.getState().refresh()
}

/** Requests a collection OTP — the backend emails it to the account's real address. */
export async function requestCollection(order: Order): Promise<{ email: string }> {
  const res = await realJobs.collectRequest({ jobId: order.jobId })
  const data = res?.DATA ?? res
  return { email: data?.email ?? useAppStore.getState().user?.email ?? 'your email' }
}

export async function confirmCollection(
  jobId: string,
  otp: string,
): Promise<{ error: string | null; stackName?: string }> {
  try {
    const res = await realJobs.collectVerify({ jobId, otp })
    const data = res?.DATA ?? res
    await useAppStore.getState().refresh()
    return { error: null, stackName: data?.stackName ?? undefined }
  } catch (err) {
    return { error: apiErrorMessage(err, 'Invalid code. Try again.') }
  }
}

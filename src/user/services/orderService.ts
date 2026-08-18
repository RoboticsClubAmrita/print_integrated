/**
 * Order lifecycle against the Postgres-backed API.
 *
 * Placing an order is four steps, and the order matters:
 *
 *   1. register — tell the backend what we're printing (name, size, sha256,
 *      and our own page count, which is provisional).
 *   2. upload   — hand over the PDF. The server counts its pages itself and
 *      that count, not ours, is what the order gets priced on.
 *   3. create   — make the job, priced from the server's count.
 *   4. pay      — settle it, against a total the server calculated.
 *
 * Nothing is charged until the document is on the server and counted, so the
 * amount the user is asked to pay always matches the document that will
 * actually be printed. The PDF is written to IndexedDB before any of this so
 * an interrupted upload can be resumed rather than restarted.
 */
import type { Order, PrintSide } from '@/types'
import { jobToOrder } from '@/lib/adapters'
import { useAppStore } from '@/store/appStore'
import { jobService as realJobs, paymentService as realPayments, fileService as realFiles } from '../../services/api'
import { apiErrorMessage } from '@/lib/apiError'
import { attachJob, dropPending, putPending } from '@/services/pendingUploads'

export interface NewOrderInput {
  /** The prepared PDF. Stays local until the order is paid for. */
  file: File
  fileName: string
  fileSizeKb: number
  /** sha256 of `file`, quoted at registration and re-checked on upload. */
  checksum: string
  totalDocPages: number
  selectedPages: number[] | null
  copies: number
  side: PrintSide
  scheduledFor: string | null
  locationId: string | null
  locationName: string | null
}

export interface PlacedOrder {
  order: Order
  /** False when the job was created but could not be marked paid. */
  paymentConfirmed: boolean
  /** The document is on the server before the job exists, so this is always true. */
  documentUploaded: boolean
  /** Set when something needs saying about the document or the price. */
  uploadNote: string | null
  /** The server's page count — what the order was actually priced on. */
  serverPages: number
  /** True when the server's count differed from ours and the price followed it. */
  pagesCorrected: boolean
}

export async function placeOrder(input: NewOrderInput): Promise<PlacedOrder> {
  const state = useAppStore.getState()
  const user = state.user
  if (!user) throw new Error('Not signed in')

  // ── 1. Register the document: metadata only, the PDF stays here.
  let fileId: string | undefined
  try {
    const res = await realFiles.register({
      userId: user.id,
      originalName: input.fileName,
      fileSize: input.file.size,
      totalPages: input.totalDocPages,
      checksum: input.checksum,
    })
    fileId = (res?.DATA ?? res)?.fileId
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Could not start the order.'))
  }
  if (!fileId) throw new Error('Could not start the order.')

  // Hold the bytes locally before any money moves, so a paid order can always
  // be completed even if this tab never gets another chance to talk to us.
  await putPending({
    fileId,
    userId: user.id,
    jobId: null,
    fileName: input.fileName,
    blob: input.file,
    checksum: input.checksum,
  }).catch(() => {
    // A browser with no usable IndexedDB (private mode, quota) still works —
    // it just can't resume an interrupted upload later in the session.
  })

  // ── 2. Hand over the PDF *before* anything is priced or charged. The
  // server counts the real document and answers with the count the order
  // will be billed on. A failure here means no order and no charge — the
  // document is still on this device and the user can simply try again.
  let serverPages = input.totalDocPages
  let pagesCorrected = false
  try {
    const uploadRes = await realFiles.uploadContent(fileId, input.file)
    const data = uploadRes?.DATA ?? uploadRes
    if (Number.isInteger(data?.totalPages) && data.totalPages > 0) {
      serverPages = data.totalPages
      pagesCorrected = Boolean(data.pagesCorrected)
    }
  } catch (err) {
    await dropPending(fileId).catch(() => {})
    throw new Error(
      apiErrorMessage(err, 'Your document could not be sent to the print server. Nothing was charged.'),
    )
  }

  // The page selection was made against our own count. If the server counted
  // fewer pages, a selection running past the end would be rejected outright,
  // so it is trimmed to what the document actually has.
  let selectedPages = input.selectedPages
  if (selectedPages && selectedPages.length) {
    const inRange = selectedPages.filter((page) => page >= 1 && page <= serverPages)
    selectedPages = inRange.length ? inRange : null
  }

  const payload: Record<string, unknown> = {
    userId: user.id,
    fileId,
    printSide: input.side,
    copies: input.copies,
    currency: 'INR',
  }
  if (input.locationId) payload.locationId = input.locationId
  // The backend 400s on an explicit `selectedPages: null` (it must be a
  // non-empty array when the field is present at all) — only send it when
  // the user picked a subset of pages.
  if (selectedPages && selectedPages.length) payload.selectedPages = selectedPages
  if (input.scheduledFor) {
    payload.scheduleType = 'SCHEDULED'
    payload.scheduledFor = input.scheduledFor
  }

  // ── 3. Create the job. It is priced from the count the server just took,
  // so the total returned here is the real one.
  let jobId: string | undefined
  try {
    const createRes = await realJobs.create(payload)
    jobId = (createRes?.DATA ?? createRes)?.jobId
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Could not place the order.'))
  }
  if (!jobId) throw new Error('Could not place the order.')
  await attachJob(fileId, jobId).catch(() => {})

  // ── 4. Settle the job, against the server's own total.
  let paymentConfirmed = true
  try {
    await realPayments.markPaid(jobId)
  } catch (first) {
    try {
      await realPayments.markPaid(jobId)
    } catch (second) {
      paymentConfirmed = false
      console.error('[placeOrder] could not mark job paid', { jobId, first, second })
    }
  }

  // The document is already delivered, so the only thing left to say is
  // whether the price moved off our estimate.
  const documentUploaded = true
  let uploadNote: string | null = null
  if (pagesCorrected) {
    uploadNote =
      `This document has ${serverPages} page${serverPages === 1 ? '' : 's'} — ` +
      `your total was recalculated to match it.`
  } else if (!paymentConfirmed) {
    uploadNote = 'Your document is safe with us, but the payment did not go through.'
  }

  const jobRes = await realJobs.getById(jobId)
  const job = jobRes?.DATA ?? jobRes
  const order = jobToOrder(job, state.locations)
  await state.refresh()
  return { order, paymentConfirmed, documentUploaded, uploadNote, serverPages, pagesCorrected }
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

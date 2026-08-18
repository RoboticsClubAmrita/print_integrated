/**
 * Order lifecycle against the Postgres-backed API.
 *
 * Placing an order is three steps, and the order matters:
 *
 *   1. register — tell the backend what we're printing (name, size, sha256,
 *      page count). No bytes. This is what the order is priced against.
 *   2. pay      — settle the job.
 *   3. upload   — only now does the PDF leave the browser.
 *
 * Between 2 and 3 the document exists nowhere but this device, so it is
 * written to IndexedDB before payment is attempted and only dropped once the
 * backend confirms receipt. `resumePendingUploads` finishes the job if this
 * tab dies in between.
 */
import type { Order, PrintSide } from '@/types'
import { jobToOrder } from '@/lib/adapters'
import { useAppStore } from '@/store/appStore'
import { jobService as realJobs, paymentService as realPayments, fileService as realFiles } from '../../services/api'
import { apiErrorMessage } from '@/lib/apiError'
import { attachJob, dropPending, flushPending, getPending, putPending } from '@/services/pendingUploads'

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
  /** False when payment landed but the document could not be delivered yet. */
  documentUploaded: boolean
  /** Set when the document upload is being retried in the background. */
  uploadNote: string | null
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
  if (input.selectedPages && input.selectedPages.length) payload.selectedPages = input.selectedPages
  if (input.scheduledFor) {
    payload.scheduleType = 'SCHEDULED'
    payload.scheduledFor = input.scheduledFor
  }

  // ── 2. Create the job. It is priced from the registered page count.
  let jobId: string | undefined
  try {
    const createRes = await realJobs.create(payload)
    jobId = (createRes?.DATA ?? createRes)?.jobId
  } catch (err) {
    // Nothing was charged and no document was sent — drop the held bytes.
    await dropPending(fileId).catch(() => {})
    throw new Error(apiErrorMessage(err, 'Could not place the order.'))
  }
  if (!jobId) {
    await dropPending(fileId).catch(() => {})
    throw new Error('Could not place the order.')
  }
  await attachJob(fileId, jobId).catch(() => {})

  // ── 3. Settle the job. Confirming settles it immediately — there is no
  // separate pay step, so this must land for the order to leave "Awaiting
  // Payment". One retry covers a transient blip; a real failure is reported
  // rather than swallowed.
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

  // ── 4. Payment is in — hand over the document. Until this lands the backend
  // holds the job back from the print queue, so a failure here delays the
  // print rather than losing the order.
  let documentUploaded = false
  let uploadNote: string | null = null

  if (paymentConfirmed) {
    const held = await getPending(fileId).catch(() => undefined)
    try {
      if (held) {
        documentUploaded = await flushPending(held)
        if (!documentUploaded) {
          uploadNote = 'Your document is still being sent — it will finish automatically.'
        }
      } else {
        // No local store available; send straight from memory.
        await realFiles.uploadContent(fileId, input.file)
        documentUploaded = true
      }
    } catch (err) {
      uploadNote = apiErrorMessage(err, 'The document could not be sent to the print server.')
    }
  } else {
    uploadNote = 'Your document stays on this device until the payment is confirmed.'
  }

  const jobRes = await realJobs.getById(jobId)
  const job = jobRes?.DATA ?? jobRes
  const order = jobToOrder(job, state.locations)
  await state.refresh()
  return { order, paymentConfirmed, documentUploaded, uploadNote }
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

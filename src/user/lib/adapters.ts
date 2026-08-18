/**
 * Maps the real backend's `{ MESSAGE, DATA }` job/penalty/location rows
 * (see print_backend/utils/serialize.js — snake_case columns → camelCase,
 * primary key → `_id`) onto this app's existing `Order`/`Penalty`/
 * `PrintLocation` shapes, so every UI component built against the mock
 * data keeps working unchanged.
 */
import type { Order, Penalty, PrintLocation } from '@/types'

/** Raw job row as returned by jobService.create/getById/getByUser/getAll (post `serializeJob`). */
export interface BackendJob {
  _id: string
  referenceId: string
  userId: string
  fileId: string
  locationId: string | null
  printerId: string | null
  colorMode: Order['colorMode']
  printSide: Order['side']
  copies: number
  pageType: Order['pageType']
  totalPagesToPrint: number
  selectedPages: number[] | null
  currency: string
  status: Order['status']
  scheduleType: Order['scheduleType']
  scheduledFor: string | null
  costPerPage: number
  printCost: number
  balanceApplied: number
  totalCost: number
  createdAt: string
  originalName?: string | null
  /** `/api/files/<fileId>/content` while the document is readable; null otherwise. */
  fileUrl?: string | null
  /** Whether the document can be fetched right now — stored, not deleted, still in retention. */
  fileIsViewable?: boolean | null
  /** REGISTERED while the document is still only on the user's device. */
  fileUploadStatus?: 'REGISTERED' | 'STORED' | null
  stackName?: string | null
  collectedStackName?: string | null
  fileSizeKb?: number
}

export interface BackendPenalty {
  _id: string
  userId: string
  jobId: string
  referenceId: string
  amount: number
  settledAmount: number
  createdAt: string
}

export interface BackendLocation {
  _id: string
  name: string
}

/** `locationName` isn't joined into the job row server-side — resolve it from the locations list. */
export function jobToOrder(job: BackendJob, locations: PrintLocation[] = []): Order {
  const location = job.locationId ? (locations.find((l) => l.id === job.locationId) ?? null) : null
  return {
    id: job.referenceId,
    jobId: job._id,
    userId: job.userId,
    fileId: job.fileId ?? null,
    // Null until the document has actually been uploaded — the UI falls back
    // to the copy still held on this device in that window.
    fileUrl: job.fileUrl ?? null,
    // The backend decides this: it knows whether the file still exists and
    // whether the 24-hour post-collection window has closed. Falling back to
    // fileUrl keeps this working against an older backend.
    documentAvailable: job.fileIsViewable ?? Boolean(job.fileUrl),
    fileName: job.originalName ?? 'Document',
    fileSizeKb: job.fileSizeKb ?? 0,
    pages: job.totalPagesToPrint,
    totalDocPages: job.totalPagesToPrint,
    copies: job.copies,
    side: job.printSide,
    colorMode: job.colorMode,
    pageType: job.pageType,
    selectedPages: job.selectedPages ?? null,
    createdAt: job.createdAt,
    scheduleType: job.scheduleType,
    scheduledFor: job.scheduledFor,
    status: job.status,
    costPerPage: job.costPerPage,
    printCost: job.printCost,
    balanceApplied: job.balanceApplied,
    totalCost: job.totalCost,
    locationId: job.locationId,
    locationName: location?.name ?? null,
    stackName: job.stackName ?? null,
    collectedStackName: job.collectedStackName ?? null,
    nextTransitionAt: null,
  }
}

export function penaltyToPenalty(p: BackendPenalty): Penalty {
  return {
    id: p._id,
    userId: p.userId,
    referenceId: p.referenceId,
    amount: p.amount,
    settledAmount: p.settledAmount,
    createdAt: p.createdAt,
  }
}

export function locationToPrintLocation(l: BackendLocation): PrintLocation {
  return { id: l._id, name: l.name }
}

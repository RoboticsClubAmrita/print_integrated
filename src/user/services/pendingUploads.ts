/**
 * Documents that have been paid for but not yet handed to the backend.
 *
 * The PDF stays on the device until payment clears, which opens a window
 * where money has moved and the server still has nothing to print. If the
 * upload fails in that window — flaky connection, closed tab, dead battery —
 * the document has to survive, or the user has paid for an order that can
 * never be fulfilled.
 *
 * So the blob goes into IndexedDB the moment the order is placed and is only
 * removed once the backend confirms it has the bytes. On the next load,
 * `resumePendingUploads()` finishes anything left behind.
 */
import { fileService } from '../../services/api'

const DB_NAME = 'pe.documents'
const DB_VERSION = 1
const STORE = 'pending'

export interface PendingUpload {
  /** Backend file id the bytes belong to. */
  fileId: string
  userId: string
  jobId: string | null
  fileName: string
  blob: Blob
  checksum: string
  createdAt: number
  /** Failed attempts so far — used to stop retrying a document the server keeps rejecting. */
  attempts: number
  /** Last failure, kept so the UI can explain why an order is stuck. */
  lastError: string | null
}

/** After this many rejections we stop retrying and let the user see the problem. */
const MAX_ATTEMPTS = 8

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'fileId' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Could not open local document store'))
    })
  }
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = run(transaction.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Local document store failed'))
      }),
  )
}

export async function putPending(entry: Omit<PendingUpload, 'attempts' | 'lastError' | 'createdAt'>): Promise<void> {
  const record: PendingUpload = { ...entry, createdAt: Date.now(), attempts: 0, lastError: null }
  await tx('readwrite', (store) => store.put(record))
}

export async function getPending(fileId: string): Promise<PendingUpload | undefined> {
  return tx<PendingUpload | undefined>('readonly', (store) => store.get(fileId))
}

export async function listPending(): Promise<PendingUpload[]> {
  const all = await tx<PendingUpload[]>('readonly', (store) => store.getAll())
  return all ?? []
}

export async function dropPending(fileId: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(fileId))
}

/** Attaches the job id once it exists, so a resumed upload can report which order it belongs to. */
export async function attachJob(fileId: string, jobId: string): Promise<void> {
  const existing = await getPending(fileId)
  if (!existing) return
  await tx('readwrite', (store) => store.put({ ...existing, jobId }))
}

async function recordFailure(entry: PendingUpload, message: string): Promise<void> {
  await tx('readwrite', (store) =>
    store.put({ ...entry, attempts: entry.attempts + 1, lastError: message }),
  )
}

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { MESSAGE?: string } }; message?: string }
  return e?.response?.data?.MESSAGE || e?.message || 'Upload failed'
}

/** True for failures that are the server's verdict, not a connectivity blip. */
function isRejection(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429
}

/**
 * Sends one held document. Returns true when the backend has it (now or
 * already). A rejection is terminal and clears the entry — retrying bytes the
 * server has judged invalid just fails forever.
 */
export async function flushPending(entry: PendingUpload): Promise<boolean> {
  const file = new File([entry.blob], entry.fileName, { type: 'application/pdf' })
  try {
    await fileService.uploadContent(entry.fileId, file)
    await dropPending(entry.fileId)
    return true
  } catch (err) {
    const message = errorMessage(err)
    if (isRejection(err) || entry.attempts + 1 >= MAX_ATTEMPTS) {
      await dropPending(entry.fileId)
      throw new Error(message)
    }
    await recordFailure(entry, message)
    return false
  }
}

/**
 * Finishes every held upload. Called on app start and after the connection
 * comes back, so a document interrupted mid-transfer lands without the user
 * having to do anything.
 *
 * @returns how many documents were delivered, and any that were rejected outright.
 */
export async function resumePendingUploads(): Promise<{ delivered: number; rejected: string[] }> {
  let delivered = 0
  const rejected: string[] = []

  for (const entry of await listPending()) {
    try {
      if (await flushPending(entry)) delivered++
    } catch (err) {
      rejected.push(`${entry.fileName}: ${err instanceof Error ? err.message : 'upload failed'}`)
    }
  }

  return { delivered, rejected }
}

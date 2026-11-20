/**
 * Live print-job change feed — the client half of GET /api/events/stream.
 *
 * The backend pushes a small `job` event whenever a print job changes
 * (PRINTING, ready to collect, collected…, from any writer). Listeners use it
 * as a doorbell and refetch through the normal endpoints.
 *
 * Why not EventSource: it cannot send an Authorization header, and the access
 * token lives in storage, not a cookie. A streaming `fetch` can, and lets us
 * refresh an expired token before reconnecting.
 *
 * One connection per tab, shared by every listener (user shell, admin
 * Orders, admin Dashboard), opened on the first subscribe and closed when the
 * last listener leaves. A dropped stream reconnects with capped backoff.
 * Polling stays on in the callers as a safety net, so a proxy that buffers
 * or cuts the stream costs latency, never correctness.
 */
import { authService } from './api'
import { getToken } from './tokenStore'

const API = import.meta.env.VITE_API_URL || '/api'
const STREAM_URL = `${API}/events/stream`

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30_000

export interface JobEvent {
  jobId: string
  status: string
  /** Present only on an admin's stream. */
  userId?: string
}

type Listener = (event: JobEvent) => void

const listeners = new Set<Listener>()
let controller: AbortController | null = null
let reconnectTimer: number | null = null
let attempt = 0
/** True once a stream has opened since the first listener arrived. */
let connectedBefore = false

function emit(event: JobEvent): void {
  for (const fn of listeners) {
    try {
      fn(event)
    } catch {
      // A failing listener must not starve the others.
    }
  }
}

/** Parses one SSE block ("event: …\ndata: …"). Returns null for comments/pings. */
export function parseSseBlock(block: string): { name: string; data: string } | null {
  let name = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) name = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  return data.length ? { name, data: data.join('\n') } : null
}

function handleBlock(block: string): void {
  const parsed = parseSseBlock(block)
  if (!parsed) return
  if (parsed.name === 'ready') {
    attempt = 0 // a healthy connection resets the backoff
    return
  }
  if (parsed.name !== 'job') return
  try {
    const evt = JSON.parse(parsed.data) as Partial<JobEvent>
    if (typeof evt.jobId === 'string') {
      emit({ jobId: evt.jobId, status: String(evt.status ?? ''), userId: evt.userId })
    }
  } catch {
    // Malformed event — ignore; the next one (or the poll) catches up.
  }
}

async function readStream(body: ReadableStream<Uint8Array>): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    let idx: number
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      handleBlock(buffer.slice(0, idx))
      buffer = buffer.slice(idx + 2)
    }
  }
}

function scheduleReconnect(): void {
  if (!listeners.size || reconnectTimer !== null) return
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS)
  attempt += 1
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    void connect()
  }, delay)
}

async function connect(): Promise<void> {
  if (!listeners.size || controller) return
  const token = getToken()
  if (!token) return // signed out: nothing to listen to

  const ctrl = new AbortController()
  controller = ctrl
  try {
    const res = await fetch(STREAM_URL, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      credentials: 'include',
      cache: 'no-store',
      signal: ctrl.signal,
    })
    if (res.status === 401) {
      // Expired access token — rotate it the same way every API call does.
      // If the session is truly over, refresh() signs out and we stop.
      controller = null
      try {
        await authService.refresh()
      } catch {
        return
      }
      scheduleReconnect()
      return
    }
    if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)
    // Changes made while the stream was down were never announced, so a
    // *re*connect tells listeners to resync once. The first connect doesn't:
    // the page has just loaded its data itself.
    if (connectedBefore) emit({ jobId: '', status: 'RESYNC' })
    connectedBefore = true
    await readStream(res.body)
  } catch {
    // Network drop, proxy cut, or abort — fall through to reconnect.
  } finally {
    if (controller === ctrl) controller = null
  }
  if (!ctrl.signal.aborted) scheduleReconnect()
}

function disconnect(): void {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  controller?.abort()
  controller = null
  attempt = 0
  connectedBefore = false
}

/**
 * Listen for job changes. Returns an unsubscribe function. A synthetic
 * `{ jobId: '', status: 'RESYNC' }` event is delivered whenever the stream
 * (re)connects, since changes made while it was down were not announced.
 */
export function subscribeJobEvents(listener: Listener): () => void {
  listeners.add(listener)
  void connect()
  return () => {
    listeners.delete(listener)
    if (!listeners.size) disconnect()
  }
}

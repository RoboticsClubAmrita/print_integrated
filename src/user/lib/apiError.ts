/**
 * Turning an axios failure into something worth showing a user.
 *
 * "Payment failed" for what is really a dropped connection sends people to
 * check their bank rather than their wifi — and the same blank failure shows
 * up when the admin workspace won't load, because both are the same thing:
 * the browser never reached the print server. Those cases are named
 * explicitly here so the message points at the actual problem.
 */

interface AxiosLikeError {
  response?: { status?: number; data?: { MESSAGE?: string; message?: string } }
  code?: string
  message?: string
}

/** No HTTP response at all — DNS, TLS, timeout, offline, or a dead upstream. */
export function isConnectivityError(err: unknown): boolean {
  const e = err as AxiosLikeError
  if (!e || typeof e !== 'object') return false
  if (e.response) return false // the server answered; whatever it said, it was reachable
  return (
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNABORTED' ||
    e.code === 'ETIMEDOUT' ||
    e.code === 'ERR_CANCELED' ||
    /network|timeout|failed to fetch/i.test(e.message ?? '')
  )
}

/** A gateway/proxy failure: our server is up as far as the browser knows, but the backend isn't answering. */
export function isUpstreamError(err: unknown): boolean {
  const status = (err as AxiosLikeError)?.response?.status
  return status === 502 || status === 503 || status === 504
}

/** True when retrying the exact same request could plausibly succeed. */
export function isRetryable(err: unknown): boolean {
  if (isConnectivityError(err) || isUpstreamError(err)) return true
  const status = (err as AxiosLikeError)?.response?.status
  return status === 408 || status === 429
}

const OFFLINE_MESSAGE =
  "You're offline — reconnect and try again. Nothing was charged."

const UNREACHABLE_MESSAGE =
  "Can't reach the print server right now. Nothing was charged — try again in a moment."

/**
 * The message to show for a failed request.
 *
 * @param fallback what to say when the server answered but gave no reason
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isConnectivityError(err)) {
    return typeof navigator !== 'undefined' && navigator.onLine === false
      ? OFFLINE_MESSAGE
      : UNREACHABLE_MESSAGE
  }

  if (isUpstreamError(err)) return UNREACHABLE_MESSAGE

  const data = (err as AxiosLikeError)?.response?.data
  return data?.MESSAGE || data?.message || fallback
}

/**
 * Retries a request while the failure looks transient, backing off between
 * attempts. Only for operations that are safe to repeat — reads, and writes
 * the backend treats idempotently.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, baseDelayMs = 600 }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === attempts - 1) throw err
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt))
    }
  }

  throw lastError
}

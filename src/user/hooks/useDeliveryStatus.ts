import { useEffect, useState } from 'react'
import { getRegistrationStatus, type DeliveryStatus } from '@/services/authService'

/** The backend watches for a bounce for 90 s after each send (utils/bounceWatcher.js). */
const WATCH_MS = 90_000
const POLL_MS = 3_000

/**
 * Polls whether the sign-up code email has bounced ("mailbox doesn't exist").
 * Stops at BOUNCED or after the watch window. A failed poll is just skipped:
 * only the backend's verdict may change what the user sees. Bump `restartKey`
 * (e.g. after a resend) to watch for another window.
 */
export function useDeliveryStatus(email: string | undefined, restartKey = 0): DeliveryStatus {
  const [status, setStatus] = useState<DeliveryStatus>('UNKNOWN')

  useEffect(() => {
    if (!email) return
    let cancelled = false
    const deadline = Date.now() + WATCH_MS

    const tick = async () => {
      try {
        const next = await getRegistrationStatus(email)
        if (cancelled) return
        setStatus(next)
        if (next === 'BOUNCED') return
      } catch {
        // Network blip or rate limit: keep the current verdict.
      }
      if (!cancelled && Date.now() < deadline) timer = window.setTimeout(tick, POLL_MS)
    }

    let timer = window.setTimeout(tick, POLL_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [email, restartKey])

  return status
}

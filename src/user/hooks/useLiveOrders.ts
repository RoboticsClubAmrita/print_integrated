import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { useJobEvents } from '../../hooks/useJobEvents'

/**
 * Safety-net poll, matching the mobile app's ShellScreen. The live feed
 * (`useJobEvents`) is what makes updates instant; this only catches up if the
 * feed is down or a proxy is buffering it.
 */
export const ORDER_POLL_INTERVAL_MS = 20_000

/**
 * Keeps order statuses live while the app is open.
 *
 * An order moves through PRINTING → COMPLETED on the print side, not from
 * anything this tab does, so without this the page keeps showing the status
 * it loaded with — including a "Cancel Order" button for a job that is
 * already printing. Refetches as soon as the backend announces a change,
 * polls as a fallback while the tab is visible, refreshes immediately when it
 * comes back into view, and pauses in demo mode (a refresh would replace the
 * injected demo order with the real list).
 */
export function useLiveOrders(userId: string | undefined, demoMode: boolean): void {
  const live = !!userId && !demoMode
  useJobEvents(() => {
    useAppStore.getState().refresh().catch(() => {
      // Same as a missed poll: the next event or poll retries.
    })
  }, live)

  useEffect(() => {
    if (!userId || demoMode) return

    let inFlight = false
    const tick = async () => {
      if (inFlight || document.visibilityState !== 'visible') return
      inFlight = true
      try {
        await useAppStore.getState().refresh()
      } catch {
        // A missed poll is harmless — the next one retries. The initial load
        // in AppShell is what reports a failure to the user.
      } finally {
        inFlight = false
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick()
    }

    const timer = window.setInterval(() => void tick(), ORDER_POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [userId, demoMode])
}

import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

/** Matches the mobile app's ShellScreen poll, so both clients see a print move on in the same time. */
export const ORDER_POLL_INTERVAL_MS = 20_000

/**
 * Keeps order statuses live while the app is open.
 *
 * An order moves through PRINTING → COMPLETED on the print side, not from
 * anything this tab does, so without this the page keeps showing the status
 * it loaded with — including a "Cancel Order" button for a job that is
 * already printing. Polls while the tab is visible, refreshes immediately
 * when it comes back into view, and pauses in demo mode (a refresh would
 * replace the injected demo order with the real list).
 */
export function useLiveOrders(userId: string | undefined, demoMode: boolean): void {
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

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app/AppHeader'
import { DockNav } from '@/components/app/DockNav'
import { WalkthroughOverlay } from '@/components/app/WalkthroughOverlay'
import { useAppStore } from '@/store/appStore'
import { useDesktop } from '@/hooks/useMediaQuery'

/**
 * Hosts the four authenticated tabs behind the sticky header (desktop) /
 * floating bottom dock (mobile). First visit with `walkthroughSeen=false`
 * shows the onboarding overlay before anything else. Pulls this user's
 * orders/penalties and the live print-hub list from the real backend
 * whenever the signed-in user changes.
 */
export function AppShell() {
  const desktop = useDesktop()
  const walkthroughSeen = useAppStore((s) => s.walkthroughSeen)
  const markWalkthroughSeen = useAppStore((s) => s.markWalkthroughSeen)
  const userId = useAppStore((s) => s.user?.id)
  const refresh = useAppStore((s) => s.refresh)
  const loadLocations = useAppStore((s) => s.loadLocations)

  useEffect(() => {
    if (!userId) return
    refresh()
    loadLocations()
  }, [userId, refresh, loadLocations])

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />
      <main className={desktop ? undefined : 'pb-28'}>
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      {!desktop && <DockNav placement="floating-bottom" />}

      <WalkthroughOverlay open={!walkthroughSeen} onFinish={markWalkthroughSeen} skipLabel="Skip" />
    </div>
  )
}

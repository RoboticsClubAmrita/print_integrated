import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app/AppHeader'
import { DockNav } from '@/components/app/DockNav'
import { WalkthroughOverlay } from '@/components/app/WalkthroughOverlay'
import { useAppStore } from '@/store/appStore'
import { useDesktop } from '@/hooks/useMediaQuery'

/**
 * Hosts the four authenticated tabs behind the sticky header (desktop) /
 * floating bottom dock (mobile). First visit with `walkthroughSeen=false`
 * shows the onboarding overlay before anything else.
 */
export function AppShell() {
  const desktop = useDesktop()
  const walkthroughSeen = useAppStore((s) => s.walkthroughSeen)
  const markWalkthroughSeen = useAppStore((s) => s.markWalkthroughSeen)

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

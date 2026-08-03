import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/app/AppHeader'
import { DockNav } from '@/components/app/DockNav'
import { WalkthroughOverlay } from '@/components/app/WalkthroughOverlay'
import { CoachTour } from '@/components/app/CoachTour'
import { WelcomeDialog } from '@/components/app/WelcomeDialog'
import { NEW_ORDER_TOUR_STEPS } from '@/lib/tourSteps'
import { useAppStore } from '@/store/appStore'
import { useDesktop } from '@/hooks/useMediaQuery'

/**
 * Hosts the four authenticated tabs behind the sticky header (desktop) /
 * floating bottom dock (mobile). First visit runs, in order: the carousel
 * walkthrough, then a spotlight coach-mark tour over the New Order page,
 * then a welcome dialog offering a guided demo order — mirrors
 * ShellScreen's TourCoordinator flow in the Flutter app.
 */
export function AppShell() {
  const desktop = useDesktop()
  const navigate = useNavigate()

  const walkthroughSeen = useAppStore((s) => s.walkthroughSeen)
  const markWalkthroughSeen = useAppStore((s) => s.markWalkthroughSeen)
  const tourSeen = useAppStore((s) => s.tourSeen)
  const markTourSeen = useAppStore((s) => s.markTourSeen)
  const demoMode = useAppStore((s) => s.demoMode)
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const removeDemoOrder = useAppStore((s) => s.removeDemoOrder)
  const userId = useAppStore((s) => s.user?.id)
  const refresh = useAppStore((s) => s.refresh)
  const loadLocations = useAppStore((s) => s.loadLocations)

  const [tourOpen, setTourOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    refresh()
    loadLocations()
  }, [userId, refresh, loadLocations])

  // Once the carousel has already been seen (returning session), the coach
  // tour can still be pending — pick it up straight away.
  useEffect(() => {
    if (walkthroughSeen && !tourSeen) {
      navigate('/app')
      setTourOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkthroughSeen, tourSeen])

  return (
    <div className="min-h-screen bg-bg">
      {demoMode && (
        <div className="relative z-[80] flex items-center gap-3 bg-ink px-4 py-2.5 text-white">
          <p className="flex-1 text-[12.5px] font-bold">Demo Mode — placing a sample order</p>
          <button
            type="button"
            onClick={() => {
              removeDemoOrder()
              setDemoMode(false)
              navigate('/app')
            }}
            className="text-[12.5px] font-bold underline underline-offset-2"
          >
            Exit
          </button>
        </div>
      )}
      <AppHeader />
      <main className={desktop ? undefined : 'pb-28'}>
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      {!desktop && <DockNav placement="floating-bottom" />}

      <WalkthroughOverlay
        open={!walkthroughSeen}
        skipLabel="Skip"
        onFinish={() => {
          markWalkthroughSeen()
          navigate('/app')
          setTourOpen(true)
        }}
      />

      <CoachTour
        steps={NEW_ORDER_TOUR_STEPS}
        open={tourOpen}
        onFinish={() => {
          setTourOpen(false)
          markTourSeen()
          setWelcomeOpen(true)
        }}
      />

      <WelcomeDialog
        open={welcomeOpen}
        onOk={() => setWelcomeOpen(false)}
        onDemo={() => {
          setWelcomeOpen(false)
          setDemoMode(true)
        }}
      />
    </div>
  )
}
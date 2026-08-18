import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { AppHeader } from '@/components/app/AppHeader'
import { DockNav } from '@/components/app/DockNav'
import { CoachTour } from '@/components/app/CoachTour'
import { WelcomeDialog } from '@/components/app/WelcomeDialog'
import { NEW_ORDER_TOUR_STEPS } from '@/lib/tourSteps'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/uiStore'
import { apiErrorMessage } from '@/lib/apiError'
import { resumePendingUploads } from '@/services/pendingUploads'
import { useDesktop } from '@/hooks/useMediaQuery'

/**
 * Hosts the four authenticated tabs behind the sticky header (desktop) /
 * floating bottom dock (mobile). First visit runs a spotlight coach-mark tour
 * over the New Order page, then a welcome dialog offering a guided demo order
 * — mirrors ShellScreen's TourCoordinator flow in the Flutter app.
 *
 * The carousel walkthrough that used to gate first launch is gone; it is still
 * available on demand from Profile -> About PrintEase -> View Demo.
 */
export function AppShell() {
  const desktop = useDesktop()
  const navigate = useNavigate()

  const tourSeen = useAppStore((s) => s.tourSeen)
  const markTourSeen = useAppStore((s) => s.markTourSeen)
  const tourReplays = useAppStore((s) => s.tourReplays)
  const demoMode = useAppStore((s) => s.demoMode)
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const removeDemoOrder = useAppStore((s) => s.removeDemoOrder)
  const userId = useAppStore((s) => s.user?.id)
  const refresh = useAppStore((s) => s.refresh)
  const loadLocations = useAppStore((s) => s.loadLocations)

  const [tourOpen, setTourOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  const exitDemo = () => {
    removeDemoOrder()
    setDemoMode(false)
    navigate('/app')
  }

  // A failed load used to reject into nothing, leaving the app looking like an
  // account with no orders. Say what actually happened instead.
  useEffect(() => {
    if (!userId) return
    refresh().catch((err) => {
      toast('Could not load your orders', apiErrorMessage(err, 'Please try again.'), 'warning')
    })
    loadLocations().catch(() => {
      // Print hubs are cosmetic until an order is placed; the location picker
      // reports its own empty state.
    })
  }, [userId, refresh, loadLocations])

  // A document is only sent after its order is paid for, which leaves a window
  // where money has moved and the bytes are still here. If that upload was
  // interrupted — connection dropped, tab closed — finish it now, and again
  // whenever the connection comes back. Until it lands the backend holds the
  // job out of the print queue, so the order is delayed rather than lost.
  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const resume = async () => {
      const { delivered, rejected } = await resumePendingUploads()
      if (cancelled) return
      if (delivered > 0) {
        toast(
          delivered === 1 ? 'Document sent' : `${delivered} documents sent`,
          'Your paid order is now with the print server.',
        )
        refresh()
      }
      for (const problem of rejected) {
        toast('Document could not be sent', problem, 'warning')
      }
    }

    void resume()
    window.addEventListener('online', resume)
    return () => {
      cancelled = true
      window.removeEventListener('online', resume)
    }
  }, [userId, refresh])

  // First visit starts straight at the coach tour.
  //
  // The flag is set the moment the tour is *shown*, not when it is finished:
  // "seen once" has to mean once however it ends. Marking it on completion
  // meant closing the tab, reloading, or backing out mid-tour left the flag
  // false, so the tour reappeared at every single login. Mirrors
  // SessionStore.seenTour in the Flutter app, which is likewise a
  // shown-once flag that survives logout.
  useEffect(() => {
    if (!tourSeen) {
      navigate('/app')
      setTourOpen(true)
      markTourSeen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourSeen])

  // Replay on demand (Profile → About PrintEase → Replay walkthrough).
  // The steps point at New Order, so go there first; CoachTour resets to
  // step 1 whenever it opens, and retries until its targets are mounted.
  useEffect(() => {
    if (!tourReplays) return
    navigate('/app')
    setWelcomeOpen(false)
    setTourOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourReplays])

  return (
    <div className="min-h-screen bg-bg">
      {demoMode && (
        <div className="relative z-[80] flex items-center gap-3 bg-ink px-4 py-2.5 text-white">
          <p className="flex-1 text-[12.5px] font-bold">Demo Mode — placing a sample order</p>
          <button
            type="button"
            onClick={exitDemo}
            className="text-[12.5px] font-bold underline underline-offset-2"
          >
            Exit
          </button>
          <button
            type="button"
            onClick={exitDemo}
            aria-label="Exit demo mode"
            title="Exit demo mode"
            className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={15} strokeWidth={2.5} />
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

      <CoachTour
        steps={NEW_ORDER_TOUR_STEPS}
        open={tourOpen}
        onFinish={() => {
          setTourOpen(false)
          setWelcomeOpen(true)
        }}
        // Dismissing with the cross skips the welcome dialog entirely — the
        // point of the cross is to get out, not to be handed another modal.
        onClose={() => setTourOpen(false)}
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
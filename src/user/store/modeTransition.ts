/**
 * Mode-switch transition state. The ProfileModeSwitch starts it with the
 * capsule's screen position; the ModeTransitionOverlay (mounted once in App)
 * plays the ink-flood, performs the navigation while covered, then clears.
 */
import { create } from 'zustand'

export type ModeTarget = 'admin' | 'user'

interface ModeTransitionState {
  active: boolean
  to: ModeTarget | null
  /** Viewport point the flood expands from (the capsule's center). */
  origin: { x: number; y: number } | null
  start: (to: ModeTarget, origin: { x: number; y: number }) => void
  finish: () => void
}

export const useModeTransition = create<ModeTransitionState>()((set) => ({
  active: false,
  to: null,
  origin: null,
  start: (to, origin) => set({ active: true, to, origin }),
  finish: () => set({ active: false, to: null, origin: null }),
}))

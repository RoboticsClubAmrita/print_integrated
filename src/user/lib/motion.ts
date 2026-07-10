/**
 * Shared motion vocabulary, ported from the Flutter app's AppMotion
 * (lib/widgets/fx.dart): one house curve (easeOutQuart) at three speeds,
 * with easeOutBack reserved for celebratory pops.
 */
import type { Transition, Variants } from 'motion/react'

export const DUR = { fast: 0.18, normal: 0.34, slow: 0.56 } as const

export const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1]
export const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

export const easeOut = (duration = DUR.normal, delay = 0): Transition => ({
  duration,
  ease: EASE,
  delay,
})

/** One-shot entrance: fade + rise, the core animation across all screens. */
export const fadeSlideUp = (delay = 0, from = 14): Variants => ({
  hidden: { opacity: 0, y: from },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE, delay } },
})

/** Parent wrapper that staggers its children's `fadeSlideUp` entrances. */
export const staggerParent = (stagger = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
})

export const fadeSlideChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
}

/** Overlay card entrance: fade + scale with a springy settle. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: DUR.normal, ease: EASE_BACK } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DUR.fast, ease: 'easeIn' } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.normal, ease: EASE } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: 'easeIn' } },
}

export const sheetUp: Variants = {
  hidden: { opacity: 0, y: '6%' },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.normal, ease: EASE } },
  exit: { opacity: 0, y: '4%', transition: { duration: DUR.fast, ease: 'easeIn' } },
}

export const drawerRight: Variants = {
  hidden: { x: '104%' },
  visible: { x: 0, transition: { duration: DUR.normal, ease: EASE } },
  exit: { x: '104%', transition: { duration: DUR.fast, ease: 'easeIn' } },
}

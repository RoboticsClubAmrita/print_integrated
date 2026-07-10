import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  FileUp,
  KeyRound,
  Package,
  Route,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'
import { clsx } from 'clsx'
import { DUR, EASE } from '@/lib/motion'
import { Button } from '@/components/ui/Button'

/** Verbatim from walkthrough_screen.dart. Reused by the landing page's "How it works". */
export const WALKTHROUGH_STEPS = [
  {
    icon: FileUp,
    title: 'Upload in seconds',
    body: 'Pick any PDF, DOC or image — PrintEase detects the page count for you instantly.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Choose your options',
    body: 'Single or double-sided, copies, colour and the exact page range — your call.',
  },
  {
    icon: Wallet,
    title: 'Pay securely',
    body: 'Checkout with Razorpay. Your total is always clear before you confirm.',
  },
  {
    icon: Route,
    title: 'Track every step',
    body: 'Watch your job move from queued to printing to ready — live, with notifications.',
  },
  {
    icon: KeyRound,
    title: 'Get a pickup OTP',
    body: "When it's ready, generate a one-time code so only you can collect it.",
  },
  {
    icon: Package,
    title: 'Grab & go',
    body: 'Show your OTP at the stack and collect your prints — no queue, no waiting.',
  },
] as const

/**
 * Six-step onboarding carousel (walkthrough_screen.dart). `skipLabel` is
 * "Skip" for the first-run flow or "Close" when replayed from About — the
 * caller decides what onFinish does next (mark-seen + redirect, vs. just
 * closing).
 */
export function WalkthroughOverlay({
  open,
  onFinish,
  skipLabel = 'Skip',
}: {
  open: boolean
  onFinish: () => void
  skipLabel?: string
}) {
  const [index, setIndex] = useState(0)
  const isLast = index === WALKTHROUGH_STEPS.length - 1
  const step = WALKTHROUGH_STEPS[index]

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.normal, ease: EASE }}
          className="dark-panel fixed inset-0 z-[75] flex flex-col overflow-hidden rounded-none"
        >
          <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />

          <div className="relative flex justify-end px-6 pt-6 sm:px-10 sm:pt-8">
            <button
              type="button"
              onClick={onFinish}
              className="text-[14px] font-bold text-white/70 hover:text-white transition-colors px-2 py-1"
            >
              {skipLabel}
            </button>
          </div>

          <div className="relative flex-1 grid place-items-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: DUR.normal, ease: EASE }}
                className="max-w-[420px] text-center"
              >
                <div className="mx-auto grid place-items-center size-32 rounded-full bg-white/10 border border-white/12 mb-8">
                  <step.icon size={48} strokeWidth={1.6} className="text-white" />
                </div>
                <h2 className="text-[26px] font-extrabold tracking-[-0.4px] text-white">
                  {step.title}
                </h2>
                <p className="mt-3 text-[15px] font-medium text-white/65 leading-relaxed">
                  {step.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative flex flex-col items-center gap-6 px-6 pb-10 sm:pb-14">
            <div className="flex items-center gap-2">
              {WALKTHROUGH_STEPS.map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ width: i === index ? 24 : 7 }}
                  transition={{ duration: DUR.normal, ease: EASE }}
                  className={clsx(
                    'h-1.5 rounded-full',
                    i === index ? 'bg-white' : 'bg-white/25',
                  )}
                />
              ))}
            </div>
            <Button
              variant="onDark"
              fullWidth
              className="max-w-[420px]"
              onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
            >
              {isLast ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

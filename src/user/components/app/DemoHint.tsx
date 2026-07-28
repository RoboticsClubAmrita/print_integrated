import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { DUR, EASE } from '@/lib/motion'

/**
 * A lightweight, single-message callout anchored under a `data-tour`
 * target — used to nudge the user during demo mode without the full
 * CoachTour machinery (no steps, no backdrop, dismisses on its own once
 * the thing it's pointing at is no longer relevant).
 */
export function DemoHint({
  open,
  targetId,
  message,
  onDismiss,
}: {
  open: boolean
  targetId: string
  message: string
  onDismiss: () => void
}) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const el = document.querySelector(`[data-tour="${targetId}"]`)
    if (!el) return
    const update = () => setRect(el.getBoundingClientRect())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, targetId])

  if (!open || !rect) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DUR.fast, ease: EASE }}
        style={{
          position: 'fixed',
          top: rect.bottom + 10,
          left: Math.min(Math.max(rect.left, 16), window.innerWidth - 296),
          width: 280,
        }}
        className="z-[85] rounded-[14px] bg-ink px-4 py-3 text-white shadow-xl"
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[12.5px] font-semibold leading-snug">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-white/60 transition-colors hover:text-white"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { DUR, EASE } from '@/lib/motion'

export interface TourStep {
  /** Matches a `data-tour="<id>"` attribute on the target element. */
  id: string
  title: string
  description: string
}

const PAD = 8

/** How long to keep looking for a step's target before giving up (~1s). */
const FIND_ATTEMPTS = 20
const FIND_RETRY_MS = 50

function useTargetRect(id: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    setRect(null)
    if (!id) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    // The target may not be mounted yet — replaying the walkthrough from
    // Profile navigates to New Order and opens the tour in the same breath.
    // Giving up on the first miss left the step with no spotlight at all,
    // so look again for a few frames before conceding.
    const attach = (attempt = 0) => {
      if (cancelled) return

      const el = document.querySelector(`[data-tour="${id}"]`)
      if (!el) {
        if (attempt < FIND_ATTEMPTS) {
          const retry = setTimeout(() => attach(attempt + 1), FIND_RETRY_MS)
          cleanup = () => clearTimeout(retry)
        }
        return
      }

      el.scrollIntoView({ block: 'center', behavior: 'smooth' })

      const update = () => setRect(el.getBoundingClientRect())
      const t = setTimeout(update, 320) // let the scroll settle first
      window.addEventListener('resize', update)
      window.addEventListener('scroll', update, true)
      cleanup = () => {
        clearTimeout(t)
        window.removeEventListener('resize', update)
        window.removeEventListener('scroll', update, true)
      }
    }

    attach()
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [id])

  return rect
}

export function CoachTour({
  steps,
  open,
  onFinish,
  onClose,
}: {
  steps: TourStep[]
  open: boolean
  /** Ran to the end (or tapped the backdrop) — the caller may follow up. */
  onFinish: () => void
  /** Dismissed via the cross. Defaults to onFinish when not supplied. */
  onClose?: () => void
}) {
  const dismiss = onClose ?? onFinish
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  const step = open ? steps[index] : null
  const rect = useTargetRect(step?.id ?? null)

  if (!open || !step) return null

  const isLast = index === steps.length - 1
  const isFirst = index === 0
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0
  const placeBelow = !rect || spaceBelow > 200
  const anchorTop = rect ? (placeBelow ? rect.bottom + 16 : rect.top - 16) : window.innerHeight / 2
  const left = rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - 336) : 16

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <motion.rect
                initial={false}
                animate={{
                  x: rect.left - PAD,
                  y: rect.top - PAD,
                  width: rect.width + PAD * 2,
                  height: rect.height + PAD * 2,
                }}
                transition={{ duration: DUR.fast, ease: EASE }}
                rx={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(10,10,10,0.72)" mask="url(#tour-mask)" />
      </svg>

      <div className="absolute inset-0" onClick={dismiss} />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: placeBelow ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.fast, ease: EASE }}
          style={{
            position: 'absolute',
            top: placeBelow ? anchorTop : undefined,
            bottom: placeBelow ? undefined : window.innerHeight - anchorTop,
            left,
            width: 320,
          }}
          className="rounded-[18px] bg-white p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-extrabold text-ink">{step.title}</h3>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Skip the walkthrough"
              title="Skip the walkthrough"
              className="-mr-1.5 -mt-1.5 grid size-7 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-ink"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-muted">
            {step.description}
          </p>
          <div className="mt-4 flex items-center justify-end gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="rounded-full px-4 py-2 text-[12.5px] font-bold text-ink hover:bg-black/5"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
              className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-bold text-white"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
            <span className="self-end pb-2.5 text-[9px] font-semibold text-black/40">
              {index + 1}/{steps.length}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  )
}
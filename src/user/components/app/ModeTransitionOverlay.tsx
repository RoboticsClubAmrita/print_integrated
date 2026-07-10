import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { clsx } from 'clsx'
import { AppIcon } from '@/components/brand/AppIcon'
import { useModeTransition } from '@/store/modeTransition'
import { EASE } from '@/lib/motion'

/**
 * The mode switch made physical: flipping to Admin floods the screen with
 * ink from the capsule itself — the press stamps its mark — then the Press
 * Room is revealed beneath. Flipping back floods with paper. While covered,
 * the route swaps; the reveal is a single clean fade so arrival feels
 * instant, not choreographed twice.
 */
export function ModeTransitionOverlay() {
  const { active, to, origin, finish } = useModeTransition()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'cover' | 'reveal'>('cover')
  const timer = useRef<number | null>(null)

  // Fresh run every activation.
  useEffect(() => {
    if (active) setPhase('cover')
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [active])

  if (!active || !to || !origin) return null

  const toAdmin = to === 'admin'
  const { x, y } = origin
  const vw = window.innerWidth
  const vh = window.innerHeight
  const radius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y)) + 24

  const onCovered = () => {
    navigate(toAdmin ? '/admin' : '/app')
    timer.current = window.setTimeout(() => setPhase('reveal'), reduced ? 220 : 400)
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`${to}-flood`}
        className="fixed inset-0 z-[90] overflow-hidden"
        style={{
          background: toAdmin
            ? 'linear-gradient(to bottom, #212127, #0b0b0d)'
            : '#f4f4f6',
        }}
        initial={
          reduced
            ? { opacity: 0 }
            : { clipPath: `circle(0px at ${x}px ${y}px)` }
        }
        animate={
          phase === 'cover'
            ? reduced
              ? { opacity: 1 }
              : { clipPath: `circle(${radius}px at ${x}px ${y}px)` }
            : { opacity: 0 }
        }
        transition={
          phase === 'cover'
            ? { duration: reduced ? 0.18 : 0.55, ease: EASE }
            : { duration: reduced ? 0.2 : 0.38, ease: 'easeIn' }
        }
        onAnimationComplete={() => {
          if (phase === 'cover') onCovered()
          else finish()
        }}
      >
        {/* the brand's dot-grid texture, in the destination's polarity */}
        <div
          aria-hidden
          className={clsx(
            'absolute inset-0 pointer-events-none',
            toAdmin ? 'bg-dots-lg' : 'bg-dots-ink',
          )}
        />

        {/* registration cross settling into alignment behind the stamp */}
        {!reduced && (
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <motion.span
              className={clsx(
                'absolute left-0 right-0 top-1/2 h-px',
                toAdmin ? 'bg-white/10' : 'bg-ink/10',
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: phase === 'cover' ? 1 : 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
            />
            <motion.span
              className={clsx(
                'absolute top-0 bottom-0 left-1/2 w-px',
                toAdmin ? 'bg-white/10' : 'bg-ink/10',
              )}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: phase === 'cover' ? 1 : 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
            />
          </div>
        )}

        {/* the mode stamp */}
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            className="flex flex-col items-center text-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, scale: phase === 'cover' ? 1 : 1.03, y: 0 }
            }
            transition={{ delay: reduced ? 0 : 0.14, duration: 0.42, ease: EASE }}
          >
            <AppIcon size={60} />
            <p
              className={clsx(
                'mt-5 text-[34px] font-extrabold italic tracking-[-1px] leading-none',
                toAdmin ? 'text-white' : 'text-ink',
              )}
            >
              {toAdmin ? 'Press Room' : 'Storefront'}
            </p>
            <p
              className={clsx(
                'mt-3 flex items-center gap-2 text-[12px] font-bold tracking-[0.6px]',
                toAdmin ? 'text-white/45' : 'text-muted',
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  'size-1.5 rounded-full',
                  toAdmin ? 'bg-warning' : 'bg-success',
                )}
              />
              {toAdmin ? 'PrintEase · Admin Mode' : 'PrintEase · User Mode'}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

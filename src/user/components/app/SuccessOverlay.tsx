import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Mail, Package } from 'lucide-react'
import { DUR, EASE, EASE_BACK } from '@/lib/motion'
import { useUiStore } from '@/store/uiStore'

const ICONS = { check: Check, mail: Mail, package: Package }

/**
 * Celebratory dark overlay (SuccessOverlay in the app): springy check badge,
 * auto-dismisses after 3s, tap-through dismiss. Driven by uiStore.success —
 * call showSuccess({ title, subtitle?, icon? }) from anywhere.
 */
export function SuccessOverlay() {
  const success = useUiStore((s) => s.success)
  const clear = useUiStore((s) => s.clearSuccess)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(clear, 3000)
    return () => clearTimeout(t)
  }, [success, clear])

  const Icon = ICONS[success?.icon ?? 'check']

  return createPortal(
    <AnimatePresence>
      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.normal, ease: EASE }}
          onClick={clear}
          role="status"
          className="fixed inset-0 z-[90] grid place-items-center bg-black/60 backdrop-blur-sm cursor-pointer px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: DUR.slow, ease: EASE }}
            className="dark-panel relative overflow-hidden rounded-[30px] px-9 py-10 max-w-[360px] w-full text-center"
          >
            <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: EASE_BACK, delay: 0.08 }}
              className="relative mx-auto grid place-items-center size-16 rounded-full bg-white"
            >
              <Icon size={30} strokeWidth={2.6} className="text-ink" />
            </motion.div>
            <p className="relative mt-5 text-[19px] font-extrabold text-white tracking-[-0.2px]">
              {success?.title}
            </p>
            {success?.subtitle && (
              <p className="relative mt-1.5 text-[13.5px] font-medium text-white/60">
                {success.subtitle}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { DUR, EASE } from '@/lib/motion'
import { useUiStore } from '@/store/uiStore'
import type { Toast } from '@/store/uiStore'

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle }
const ICON_TINT = { info: 'text-white/80', success: 'text-success', warning: 'text-warning' }

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((s) => s.dismissToast)
  const timerRef = useRef<number>(0)

  const arm = () => {
    timerRef.current = window.setTimeout(() => dismiss(toast.id), 4000)
  }
  useEffect(() => {
    arm()
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Icon = ICONS[toast.tone]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: DUR.normal, ease: EASE }}
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={arm}
      onClick={() => dismiss(toast.id)}
      role="status"
      className="dark-panel pointer-events-auto flex items-start gap-3 rounded-[18px] px-4 py-3.5 w-full sm:w-[360px] cursor-pointer select-none"
    >
      <Icon size={19} strokeWidth={2.2} className={`${ICON_TINT[toast.tone]} shrink-0 mt-[1px]`} />
      <div className="min-w-0">
        <p className="text-[14px] font-extrabold text-white leading-snug">{toast.title}</p>
        {toast.body && (
          <p className="text-[12.5px] font-medium text-white/65 leading-snug mt-0.5 truncate">
            {toast.body}
          </p>
        )}
      </div>
    </motion.div>
  )
}

/** Bottom-right on desktop; above the floating dock on mobile. */
export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  return createPortal(
    <div
      aria-live="polite"
      className="fixed z-[80] pointer-events-none flex flex-col gap-2 items-center bottom-[108px] inset-x-4 sm:inset-x-auto sm:items-end sm:bottom-6 sm:right-6"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

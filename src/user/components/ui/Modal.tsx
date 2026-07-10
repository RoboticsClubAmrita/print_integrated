import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { fadeIn, popIn } from '@/lib/motion'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { IconButton } from '@/components/ui/IconButton'

const SIZES = { sm: 'max-w-[400px]', md: 'max-w-[480px]', lg: 'max-w-[640px]' }

/** Centered dialog: dark backdrop, springy card, Escape/backdrop dismiss. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissible = true,
  showClose = false,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: keyof typeof SIZES
  dismissible?: boolean
  showClose?: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose()
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissible, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/55"
            onClick={dismissible ? onClose : undefined}
            aria-hidden
          />
          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx('relative w-full bg-white rounded-[28px] shadow-pop p-6', SIZES[size])}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between gap-4 mb-4">
                {title && <h2 className="text-[18px] font-extrabold tracking-[-0.2px]">{title}</h2>}
                {showClose && <IconButton icon={X} label="Close" size={38} onClick={onClose} />}
              </div>
            )}
            {children}
            {footer && <div className="mt-6 flex gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

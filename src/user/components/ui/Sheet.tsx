import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { drawerRight, fadeIn, sheetUp } from '@/lib/motion'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { IconButton } from '@/components/ui/IconButton'

/** Drawer (right, desktop) / bottom sheet (mobile) sharing Modal semantics. */
export function Sheet({
  open,
  onClose,
  side = 'bottom',
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  side?: 'right' | 'bottom'
  title?: string
  children: ReactNode
}) {
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const isRight = side === 'right'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/55"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={isRight ? drawerRight : sheetUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              'absolute bg-white shadow-pop flex flex-col',
              isRight
                ? 'top-0 right-0 h-full w-[440px] max-w-[92vw] rounded-l-[28px]'
                : 'bottom-0 inset-x-0 max-h-[85vh] rounded-t-[28px]',
            )}
          >
            {!isRight && (
              <div aria-hidden className="mx-auto mt-3 h-1.5 w-11 rounded-full bg-line" />
            )}
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-2">
              {title && <h2 className="text-[18px] font-extrabold tracking-[-0.2px]">{title}</h2>}
              <IconButton icon={X} label="Close" size={38} onClick={onClose} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function WelcomeDialog({
  open,
  onOk,
  onDemo,
}: {
  open: boolean
  onOk: () => void
  onDemo: () => void
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] grid place-items-center bg-black/50 px-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-[360px] rounded-[24px] bg-white p-7 text-center"
          >
            <div className="dark-panel mx-auto grid size-16 place-items-center rounded-full">
              <PartyPopper size={28} className="text-white" />
            </div>
            <h2 className="mt-4 text-[19px] font-extrabold text-ink">You're All Set!</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Welcome to PrintEase — you now know your way around. Go ahead and place your first
              print order!
            </p>
            <Button fullWidth className="mt-5" onClick={onOk}>
              OK
            </Button>
            <button
              type="button"
              onClick={onDemo}
              className="mt-2.5 text-[13px] font-bold text-ink/70 hover:text-ink"
            >
              Show Me How to Order
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
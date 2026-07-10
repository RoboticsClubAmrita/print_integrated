import { motion } from 'motion/react'
import { FileText, KeyRound } from 'lucide-react'
import { TicketCard } from '@/components/app/TicketCard'
import { StatusChip } from '@/components/app/StatusChip'
import { AppIcon } from '@/components/brand/AppIcon'
import { staggerParent, fadeSlideChild } from '@/lib/motion'

/**
 * Illustrative hero scene: a real order ticket, the dock, and a floating
 * OTP chip drifting gently — composed entirely from production components
 * so the marketing page never drifts out of sync with the real product.
 */
export function TicketShowcase() {
  return (
    <motion.div
      variants={staggerParent(0.12, 0.2)}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-[420px] mx-auto lg:mx-0 aspect-[4/5]"
    >
      <motion.div
        variants={fadeSlideChild}
        className="absolute inset-x-4 top-2 animate-float-slow"
      >
        <TicketCard
          top={
            <div className="flex items-center gap-3">
              <span className="grid place-items-center size-11 rounded-[14px] bg-chip shrink-0">
                <FileText size={19} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink truncate">Resume_2026.pdf</p>
                <p className="text-[12px] font-medium text-muted mt-0.5">PE-1046 • 2 pages</p>
              </div>
              <StatusChip status="COMPLETED" />
            </div>
          }
          bottom={
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-chip text-[11.5px] font-bold text-muted">
                Stack B
              </span>
              <span className="text-[16px] font-extrabold text-ink">₹4</span>
            </div>
          }
        />
      </motion.div>

      <motion.div
        variants={fadeSlideChild}
        className="absolute -bottom-4 left-2 animate-float-slow"
        style={{ animationDelay: '1.4s' }}
      >
        <div className="dark-panel relative overflow-hidden rounded-[22px] px-5 py-4 flex items-center gap-3 shadow-dock">
          <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
          <span className="relative grid place-items-center size-9 rounded-full bg-white/12 border border-white/15">
            <KeyRound size={16} className="text-white" strokeWidth={2} />
          </span>
          <div className="relative">
            <p className="text-[11px] font-semibold text-white/50">Pickup code</p>
            <p className="text-[18px] font-extrabold tracking-[4px] text-white">4 8 2 1</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={fadeSlideChild}
        className="absolute -top-3 -right-2 animate-float-slow"
        style={{ animationDelay: '0.7s' }}
      >
        <div className="dark-panel relative overflow-hidden rounded-[18px] size-14 grid place-items-center shadow-dock">
          <div aria-hidden className="absolute inset-0 bg-dots" />
          <AppIcon size={28} className="relative" />
        </div>
      </motion.div>
    </motion.div>
  )
}

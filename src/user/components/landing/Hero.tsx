import { Link } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { AppIcon } from '@/components/brand/AppIcon'
import { TicketCard } from '@/components/app/TicketCard'
import { StatusChip } from '@/components/app/StatusChip'
import { staggerParent, fadeSlideChild, EASE, EASE_BACK } from '@/lib/motion'
import { useAppStore } from '@/store/appStore'

export function Hero() {
  const isLoggedIn = useAppStore((s) => !!s.user)

  return (
    <section className="relative mx-auto max-w-[1180px] px-4 sm:px-6 pt-14 pb-24 sm:pt-20 sm:pb-32 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
      <motion.div
        variants={staggerParent()}
        initial="hidden"
        animate="visible"
        className="lg:col-span-7 text-center lg:text-left"
      >
        <motion.span
          variants={fadeSlideChild}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-chip text-[12.5px] font-bold text-ink"
        >
          <span className="size-1.5 rounded-full bg-success" />
          Built for Amrita campus printing
        </motion.span>

        <motion.h1
          variants={fadeSlideChild}
          className="mt-5 text-[42px] sm:text-[56px] lg:text-[64px] font-extrabold tracking-[-2px] leading-[1.02] text-ink text-balance"
        >
          Campus printing,
          <br />
          minus the queue.
        </motion.h1>

        <motion.p
          variants={fadeSlideChild}
          className="mt-6 text-[16px] sm:text-[18px] font-medium text-muted max-w-[480px] mx-auto lg:mx-0 leading-relaxed"
        >
          Upload a document, set your pages and copies, pay in seconds, and collect with a
          one-time code — no counters, no waiting.
        </motion.p>

        <motion.div
          variants={fadeSlideChild}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
        >
          {isLoggedIn ? (
            <Link
              to="/app"
              className="press inline-flex items-center gap-2.5 h-14 px-7 rounded-[16px] bg-ink text-white font-bold text-[16px] hover:bg-ink-soft transition-colors w-full sm:w-auto justify-center"
            >
              Open the app
              <ArrowRight size={18} strokeWidth={2.2} />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="press inline-flex items-center gap-2.5 h-14 px-7 rounded-[16px] bg-ink text-white font-bold text-[16px] hover:bg-ink-soft transition-colors w-full sm:w-auto justify-center"
              >
                Start printing
                <ArrowRight size={18} strokeWidth={2.2} />
              </Link>
              <Link
                to="/login"
                className="press-soft inline-flex items-center h-14 px-7 rounded-[16px] border-[1.5px] border-line text-ink font-bold text-[16px] hover:border-muted/50 transition-colors w-full sm:w-auto justify-center"
              >
                Sign in
              </Link>
            </>
          )}
        </motion.div>

        {/* the receipt line — rates and promises in the artifact's own type */}
        <motion.p
          variants={fadeSlideChild}
          className="mt-7 font-receipt text-[13px] font-bold tracking-[0.2px] text-muted"
        >
          ₹2 / page&ensp;·&ensp;pickup by code&ensp;·&ensp;live status
        </motion.p>
      </motion.div>

      <div className="lg:col-span-5 min-w-0">
        <PressScene />
      </div>
    </section>
  )
}

/**
 * The hero object: a print dock (the press's mouth) feeding out a finished
 * order ticket — the product's whole promise as one physical scene. Built
 * from the app's real TicketCard/StatusChip so marketing never drifts from
 * the product. The ticket slides out of the slot once on load.
 */
function PressScene() {
  const reduced = useReducedMotion()

  return (
    <div className="relative w-full max-w-[420px] mx-auto lg:mx-0 lg:ml-auto">
      {/* one quiet registration mark anchoring the composition */}
      <svg
        aria-hidden
        viewBox="0 0 44 44"
        className="absolute -left-10 -top-8 hidden sm:block size-11 text-ink/15"
        fill="none"
      >
        <circle cx="22" cy="22" r="12" stroke="currentColor" strokeWidth="1.4" />
        <path d="M22 2v40M2 22h40" stroke="currentColor" strokeWidth="1.4" />
      </svg>

      {/* THE DOCK — the machine the ticket comes from */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="dark-panel relative z-10 overflow-hidden rounded-[26px] px-5 py-4"
      >
        <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
        <div className="relative flex items-center gap-3.5">
          <AppIcon size={38} className="shrink-0" />
          <div className="min-w-0 flex-1 leading-none">
            <p className="text-[13.5px] font-bold text-white">Library 1F · Stack B</p>
            <p className="mt-1.5 font-receipt text-[11.5px] font-bold text-white/45 truncate">
              NOW PRINTING…
            </p>
          </div>
          <span className="relative flex items-center gap-2">
            <span className="relative grid place-items-center">
              <span className="absolute size-4 rounded-full bg-success/30 animate-pulse-ring" />
              <span className="size-2 rounded-full bg-success" />
            </span>
            <span className="text-[11px] font-bold tracking-[1.5px] text-white/55">LIVE</span>
          </span>
        </div>
        {/* the output slot */}
        <div
          aria-hidden
          className="relative mt-4 h-[7px] rounded-full bg-black/70 shadow-[inset_0_2px_4px_rgb(0_0_0_/_0.9),inset_0_-1px_0_rgb(255_255_255_/_0.08)]"
        />
      </motion.div>

      {/* THE TICKET — fed out of the slot, clipped while emerging */}
      <div className="relative z-0 -mt-2.5 overflow-hidden px-4 sm:px-6 pb-8 pt-2.5">
        <motion.div
          initial={reduced ? false : { y: '-96%', rotate: 0 }}
          animate={{ y: '0%', rotate: -1.1 }}
          transition={{ duration: 1.0, ease: EASE, delay: reduced ? 0 : 0.45 }}
          style={{ transformOrigin: 'top center' }}
        >
          <TicketCard
            top={
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-11 rounded-[14px] bg-chip shrink-0">
                    <FileText size={19} strokeWidth={1.8} />
                  </span>
                  <p className="min-w-0 flex-1 text-[15px] font-bold text-ink truncate">
                    Resume.pdf
                  </p>
                  <motion.span
                    className="shrink-0"
                    initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.34, ease: EASE_BACK, delay: reduced ? 0 : 1.35 }}
                  >
                    <StatusChip status="COMPLETED" />
                  </motion.span>
                </div>
                <p className="mt-3 font-receipt text-[12px] font-bold tracking-[0.5px] text-muted truncate">
                  JOB PE-1046 · 2 PAGES · B&amp;W
                </p>
              </div>
            }
            bottom={
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-receipt text-[11px] font-bold tracking-[1.5px] text-muted">
                    PICKUP CODE
                  </p>
                  <p className="mt-1 font-receipt text-[24px] font-bold tracking-[7px] text-ink leading-none">
                    4821
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-receipt text-[11px] font-bold tracking-[1.5px] text-muted">
                    TOTAL
                  </p>
                  <p className="mt-1 font-receipt text-[24px] font-bold text-ink leading-none">
                    ₹4
                  </p>
                </div>
              </div>
            }
          />
        </motion.div>

        {/* resting shadow, fading in as the ticket lands */}
        <motion.div
          aria-hidden
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 1.15 }}
          className="absolute inset-x-10 -bottom-1 h-8 rounded-[50%] bg-ink/10 blur-xl"
        />
      </div>
    </div>
  )
}

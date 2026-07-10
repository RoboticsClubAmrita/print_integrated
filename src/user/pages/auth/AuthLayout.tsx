import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AppIcon } from '@/components/brand/AppIcon'
import { BrandMark } from '@/components/brand/BrandMark'
import { DUR, EASE } from '@/lib/motion'

/** Rotating one-liners drawn from the walkthrough copy. */
const QUOTES = [
  'Upload any PDF, DOC or image — we detect the page count instantly.',
  'Single or double-sided, exact page ranges — your call.',
  'Checkout with Razorpay. Your total is always clear before you confirm.',
  'Watch your job move from queued to printing to ready — live.',
  'Collect with a one-time code — no queue, no waiting.',
]

/** Real product capabilities, rendered along the base of the panel. */
const FEATURES = ['Instant page count', 'Live job status', 'Pickup by code']

/**
 * Auth shell as one framed editorial card: the whole viewport is the brand
 * background, holding a single hairline-bordered white card. Inside, the
 * form column (left) sits beside an inset dark panel (≥lg) decorated with
 * print craft — crop marks, an outlined paper-stack line drawing, the brand
 * statement with an outlined display word, a rotating walkthrough line and
 * a capability strip. No mock data, no fake numbers.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const [quoteIndex, setQuoteIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex((i) => (i + 1) % QUOTES.length), 4800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative flex min-h-screen bg-bg p-3 sm:p-5">
      {/* faint ink dot texture on the page itself */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots-ink opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.slow, ease: EASE }}
        className="relative m-auto flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[28px] border border-line bg-white shadow-lift sm:rounded-[32px] lg:grid lg:h-[calc(100vh-2.5rem)] lg:min-h-[560px] lg:grid-cols-[1.02fr_0.98fr]"
      >
        {/* ————— Form column ————— */}
        <div className="no-scrollbar flex flex-col px-6 py-8 sm:px-12 sm:py-10 lg:overflow-y-auto lg:px-14 lg:py-6">
          <header>
            <Link to="/" className="press-soft inline-block">
              <BrandMark />
            </Link>
          </header>

          {/* Compact brand strip below lg (panel hidden) */}
          <div className="dark-panel relative mt-7 flex items-center gap-3.5 overflow-hidden rounded-[20px] px-4 py-3.5 lg:hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots" />
            <AppIcon size={38} className="relative shrink-0" />
            <p className="relative flex-1 text-[13px] font-bold leading-snug text-white">
              Campus printing, minus the queue.
            </p>
            <span aria-hidden className="relative size-2 shrink-0 rounded-full bg-success shadow-[0_0_10px_rgb(52_199_89_/_0.8)]" />
          </div>

          <main className="flex flex-1 items-center py-3">
            <div className="mx-auto w-full max-w-[400px] lg:mx-0">{children}</div>
          </main>

          <footer className="flex items-center gap-2 text-[12px] font-medium text-muted">
            <span>© 2026 PrintEase</span>
            <span aria-hidden className="text-line">·</span>
            <Link to="/" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <span aria-hidden className="text-line">·</span>
            <Link to="/" className="transition-colors hover:text-ink">
              Privacy
            </Link>
          </footer>
        </div>

        {/* ————— Inset dark panel ————— */}
        <aside className="relative hidden lg:block lg:p-3">
          <div className="dark-panel relative flex h-full flex-col overflow-hidden rounded-[24px] px-11 py-10 xl:px-12">
            {/* ambience: dots, soft green bloom, oversized outline circles */}
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(560px circle at 78% 18%, rgb(52 199 89 / 0.10), transparent 60%)',
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-36 -top-36 size-[380px] rounded-full border border-white/[0.07]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-44 -left-28 size-[460px] rounded-full border border-white/[0.05]"
            />

            {/* print crop marks in each corner */}
            <CropMark className="left-5 top-5 border-l border-t" />
            <CropMark className="right-5 top-5 border-r border-t" />
            <CropMark className="bottom-5 left-5 border-b border-l" />
            <CropMark className="bottom-5 right-5 border-b border-r" />

            {/* top: outlined label chip */}
            <div className="relative flex justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[2.2px] text-white/60">
                <span className="size-1.5 rounded-full bg-success" />
                Campus print, on demand
              </span>
            </div>

            {/* middle: paper-stack line drawing + statement */}
            <div className="relative flex flex-1 flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.slow, ease: EASE, delay: 0.15 }}
              >
                <PaperStack />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.slow, ease: EASE, delay: 0.28 }}
              >
                <h2 className="mt-9 text-[34px] font-extrabold leading-[1.1] tracking-[-0.7px] text-white xl:text-[38px]">
                  Campus printing,
                  <br />
                  <span
                    className="text-transparent"
                    style={{ WebkitTextStroke: '1.3px rgb(255 255 255 / 0.85)' }}
                  >
                    minus the queue.
                  </span>
                </h2>
                <div className="mt-4 h-[44px] max-w-[380px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={quoteIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: DUR.normal, ease: EASE }}
                      className="text-[14px] font-medium leading-relaxed text-white/50"
                    >
                      {QUOTES[quoteIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* bottom: capability strip */}
            <div className="relative border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                {FEATURES.map((f) => (
                  <span key={f} className="flex items-center gap-2 text-[12px] font-semibold text-white/55">
                    <span aria-hidden className="size-1 rounded-full bg-success/80" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  )
}

/** One L-shaped print crop mark; position + sides come from className. */
function CropMark({ className }: { className: string }) {
  return <span aria-hidden className={`pointer-events-none absolute size-4 border-white/25 ${className}`} />
}

/**
 * Outlined line drawing of a paper stack — three hairline sheets fanned at
 * slight angles, the front one carrying a folded corner, print bars and the
 * green "ready" dot. Pure stroke work, echoing the reference's outline motif.
 */
function PaperStack() {
  return (
    <svg
      viewBox="0 0 340 290"
      fill="none"
      aria-hidden="true"
      className="w-full max-w-[300px] xl:max-w-[330px]"
    >
      {/* back sheets */}
      <g transform="rotate(-9 170 150)">
        <rect x="88" y="34" width="164" height="222" rx="22" stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="1.5" />
      </g>
      <g transform="rotate(-2 170 150)">
        <rect x="88" y="34" width="164" height="222" rx="22" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.5" />
      </g>

      {/* front sheet with folded corner */}
      <g transform="rotate(5 170 150)">
        <path
          d="M 110 34 H 208 L 252 78 V 234 Q 252 256 230 256 H 110 Q 88 256 88 234 V 56 Q 88 34 110 34 Z"
          fill="#FFFFFF"
          fillOpacity="0.03"
          stroke="#FFFFFF"
          strokeOpacity="0.42"
          strokeWidth="1.5"
        />
        <path
          d="M 208 34 V 78 H 252"
          stroke="#FFFFFF"
          strokeOpacity="0.42"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* print bars */}
        <rect x="112" y="106" width="78" height="11" rx="5.5" fill="#FFFFFF" fillOpacity="0.85" />
        <rect x="112" y="130" width="106" height="11" rx="5.5" fill="#FFFFFF" fillOpacity="0.28" />
        <rect x="112" y="154" width="64" height="11" rx="5.5" fill="#FFFFFF" fillOpacity="0.28" />
        {/* ready dot */}
        <circle cx="228" cy="228" r="11" stroke="#34C759" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="228" cy="228" r="5" fill="#34C759" />
      </g>

      {/* registration marks */}
      <g stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1.2">
        <path d="M 30 60 v 14 M 23 67 h 14" />
        <path d="M 310 200 v 14 M 303 207 h 14" />
      </g>
    </svg>
  )
}

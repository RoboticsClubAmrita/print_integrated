import { motion } from 'motion/react'
import { WALKTHROUGH_STEPS } from '@/components/app/WalkthroughOverlay'
import { StatusTimeline } from '@/components/app/StatusTimeline'
import { staggerParent, fadeSlideChild } from '@/lib/motion'

/** Reuses the app's own onboarding copy — one source of truth, two surfaces. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1180px] px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        variants={fadeSlideChild}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="text-center max-w-[560px] mx-auto mb-14"
      >
        <p className="text-[12.5px] font-bold text-success uppercase tracking-wide">
          How it works
        </p>
        <h2 className="mt-2 text-[32px] sm:text-[40px] font-extrabold tracking-[-0.8px] text-ink leading-tight">
          From upload to pickup, six simple steps.
        </h2>
      </motion.div>

      <motion.div
        variants={staggerParent(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {WALKTHROUGH_STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            variants={fadeSlideChild}
            className={i === 3 ? 'dark-panel relative overflow-hidden rounded-[24px] p-6' : 'card p-6'}
          >
            {i === 3 && <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />}
            <div className="relative">
              <span
                className={
                  i === 3
                    ? 'grid place-items-center size-11 rounded-[14px] bg-white/10 border border-white/12 mb-4'
                    : 'grid place-items-center size-11 rounded-[14px] bg-chip mb-4'
                }
              >
                <step.icon size={19} strokeWidth={1.8} className={i === 3 ? 'text-white' : 'text-ink'} />
              </span>
              <h3
                className={
                  i === 3
                    ? 'text-[16px] font-extrabold text-white tracking-[-0.2px]'
                    : 'text-[16px] font-extrabold text-ink tracking-[-0.2px]'
                }
              >
                {i + 1}. {step.title}
              </h3>
              <p
                className={
                  i === 3
                    ? 'mt-2 text-[13.5px] font-medium text-white/60 leading-relaxed'
                    : 'mt-2 text-[13.5px] font-medium text-muted leading-relaxed'
                }
              >
                {step.body}
              </p>

              {i === 3 && (
                <div className="mt-5 scale-90 origin-left opacity-90">
                  <StatusTimeline status="PRINTING" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

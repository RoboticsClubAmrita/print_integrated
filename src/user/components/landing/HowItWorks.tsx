import { motion } from 'motion/react'
import { WALKTHROUGH_STEPS } from '@/components/app/WalkthroughOverlay'
import { staggerParent, fadeSlideChild } from '@/lib/motion'
import { clsx } from 'clsx'

/**
 * The walkthrough as a printed JOB SHEET: one ticket-framed sheet — header
 * strip, perforation with punched notches, then the six stations separated
 * by hairlines. Numbers are earned here (it's a real sequence), set in the
 * receipt type like everything the press prints. Step 5, the pickup code,
 * is the payoff — it gets the ink cell.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-16 pb-24 sm:pt-20 sm:pb-32">
      <motion.div
        variants={fadeSlideChild}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-[620px] mb-12"
      >
        <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-[-0.8px] text-ink leading-tight text-balance">
          From upload to pickup, one clean run.
        </h2>
        <p className="mt-3 text-[15px] font-medium text-muted leading-relaxed">
          Every order moves like a job through the press — six stations, no counter visits.
        </p>
      </motion.div>

      <div className="relative">
        {/* the press bed the sheet rests on */}
        <div
          aria-hidden
          className="absolute -inset-x-4 -top-10 -bottom-8 sm:-inset-x-6 bg-dots-ink [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_74%)] pointer-events-none"
        />

        <motion.div
          variants={fadeSlideChild}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative ticket-lift"
        >
          {/* sheet header */}
          <div className="bg-white border border-line border-b-0 rounded-t-card px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
            <p className="font-receipt text-[12.5px] font-bold tracking-[2px] text-ink whitespace-nowrap">
              PRINTEASE · JOB SHEET
            </p>
            <p className="hidden sm:block font-receipt text-[12.5px] font-bold tracking-[1px] text-muted whitespace-nowrap">
              6 STATIONS · ~2 MIN
            </p>
          </div>

          {/* perforation strip with punched notches */}
          <div className="ticket-strip [--notch-r:16px]">
            <div aria-hidden className="ticket-notches absolute inset-0 bg-white border-x border-line" />
            <div aria-hidden className="absolute inset-y-0 inset-x-10 perforation" />
          </div>

          {/* the stations */}
          <motion.div
            variants={staggerParent(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line/60 border border-line border-t-0 rounded-b-card overflow-hidden"
          >
          {WALKTHROUGH_STEPS.map((step, i) => {
            const inked = i === 4
            return (
              <motion.div
                key={step.title}
                variants={fadeSlideChild}
                className={clsx(
                  'relative p-6 sm:p-7',
                  inked ? 'dark-panel border-0 rounded-none' : 'bg-white',
                )}
              >
                {inked && (
                  <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        'font-receipt text-[13px] font-bold tracking-[1px]',
                        inked ? 'text-white/50' : 'text-muted',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <step.icon
                      size={18}
                      strokeWidth={1.9}
                      className={inked ? 'text-success' : 'text-ink/60'}
                    />
                  </div>
                  <h3
                    className={clsx(
                      'mt-4 text-[16px] font-extrabold tracking-[-0.2px]',
                      inked ? 'text-white' : 'text-ink',
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={clsx(
                      'mt-1.5 text-[13.5px] font-medium leading-relaxed',
                      inked ? 'text-white/60' : 'text-muted',
                    )}
                  >
                    {step.body}
                  </p>
                </div>
              </motion.div>
            )
          })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

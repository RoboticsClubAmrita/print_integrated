import { motion } from 'motion/react'
import { KeyRound, MapPin, SlidersHorizontal, Wallet } from 'lucide-react'
import { StatusTimeline } from '@/components/app/StatusTimeline'
import { staggerParent, fadeSlideChild } from '@/lib/motion'

const FEATURES = [
  {
    icon: KeyRound,
    title: 'Secure OTP pickup',
    body: 'A one-time code means only you can collect your prints — no mix-ups at the stack.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Exact page ranges',
    body: 'Full documents or pages 4–9 only: print precisely what you need, priced per page.',
  },
  {
    icon: Wallet,
    title: 'Clear totals, paid online',
    body: 'Razorpay checkout with the exact price shown before you confirm — no cash at the counter.',
  },
  {
    icon: MapPin,
    title: 'Every campus location',
    body: 'Print hubs across campus — send the job to whichever stack suits your route.',
  },
]

/**
 * One live panel + three quiet rows. The tracking demo IS the app's real
 * StatusTimeline component, running on the brand's ink panel — proof, not
 * illustration. The remaining features read as a printed spec list.
 */
export function FeatureGrid() {
  return (
    <section id="features" className="bg-white border-y border-line/60 py-20 sm:py-24">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <motion.div
          variants={fadeSlideChild}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="max-w-[640px] mx-auto text-center mb-12 sm:mb-14"
        >
          <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-[-0.8px] text-ink leading-tight text-balance">
            Everything a print queue should be.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-stretch">
          {/* live status panel */}
          <motion.div
            variants={fadeSlideChild}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="lg:col-span-5 dark-panel relative overflow-hidden rounded-[26px] p-7 sm:p-9"
          >
            <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(420px circle at 82% 8%, rgb(52 199 89 / 0.12), transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="text-[22px] font-extrabold tracking-[-0.4px] text-white">
                Watch it print.
              </h3>
              <p className="mt-2 text-[14px] font-medium text-white/55 leading-relaxed max-w-[320px]">
                Every job reports its progress live — from queued to printing to ready for
                pickup.
              </p>
              <div className="mt-8">
                <StatusTimeline status="PRINTING" onDark />
              </div>
            </div>
          </motion.div>

          {/* spec list */}
          <motion.div
            variants={staggerParent(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="lg:col-span-7 flex flex-col justify-center divide-y divide-line/70"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeSlideChild}
                className="flex items-start gap-5 py-6 first:pt-2 last:pb-2"
              >
                <span className="grid place-items-center size-12 rounded-btn bg-chip border border-line/60 shrink-0">
                  <f.icon size={19} strokeWidth={1.8} className="text-ink" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-extrabold text-ink tracking-[-0.2px]">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] font-medium text-muted leading-relaxed max-w-[52ch]">
                    {f.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

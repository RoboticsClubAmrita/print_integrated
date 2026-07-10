import { motion } from 'motion/react'
import { KeyRound, MapPin, Route, SlidersHorizontal } from 'lucide-react'
import { staggerParent, fadeSlideChild } from '@/lib/motion'

const FEATURES = [
  {
    icon: Route,
    title: 'Live order tracking',
    body: 'Watch every job move from queued to printing to ready, in real time.',
  },
  {
    icon: KeyRound,
    title: 'Secure OTP pickup',
    body: 'A one-time code means only you can collect your prints — no mix-ups.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Precise page ranges',
    body: 'Print exactly what you need: full documents or a custom page selection.',
  },
  {
    icon: MapPin,
    title: 'Every campus location',
    body: 'Choose from print hubs across campus and collect wherever suits you.',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="bg-chip/40 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <motion.div
          variants={fadeSlideChild}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center max-w-[560px] mx-auto mb-14"
        >
          <p className="text-[12.5px] font-bold text-success uppercase tracking-wide">Features</p>
          <h2 className="mt-2 text-[32px] sm:text-[40px] font-extrabold tracking-[-0.8px] text-ink leading-tight">
            Everything a print queue should be.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeSlideChild} className="card p-6">
              <span className="grid place-items-center size-11 rounded-[14px] bg-chip mb-4">
                <f.icon size={19} strokeWidth={1.8} />
              </span>
              <h3 className="text-[15.5px] font-extrabold text-ink tracking-[-0.2px]">
                {f.title}
              </h3>
              <p className="mt-2 text-[13.5px] font-medium text-muted leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { motion } from 'motion/react'
import { TicketCard } from '@/components/app/TicketCard'
import { PillToggle } from '@/components/ui/PillToggle'
import { PRICE_TABLE } from '@/lib/pricing'
import { fadeSlideChild, staggerParent } from '@/lib/motion'
import type { PaperSize } from '@/types'

/**
 * Rates printed the way the press would print them: one rate ticket (the
 * perforation splits single from double-sided), then the full tariff per
 * paper size. Prices sit in the receipt type — they're the artifact.
 */
export function PricingSection() {
  const [size, setSize] = useState<PaperSize>('A4')
  const rows = PRICE_TABLE.filter((r) => r.size === size)

  return (
    <section id="pricing" className="mx-auto max-w-[1180px] px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        variants={staggerParent(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid lg:grid-cols-12 gap-12 lg:gap-8"
      >
        {/* left: heading + the rate ticket */}
        <div className="lg:col-span-5">
          <motion.div variants={fadeSlideChild}>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-[-0.8px] text-ink leading-tight text-balance">
              Simple, transparent rates.
            </h2>
            <p className="mt-3 text-[15px] font-medium text-muted leading-relaxed max-w-[400px]">
              No subscriptions, no hidden fees — pay only for what you print, per page.
            </p>
          </motion.div>

          <motion.div variants={fadeSlideChild} className="mt-8 max-w-[380px]">
            <TicketCard
              top={
                <div className="flex items-end justify-between py-1">
                  <div>
                    <p className="font-receipt text-[11px] font-bold tracking-[1.5px] text-muted">
                      SINGLE-SIDED
                    </p>
                    <p className="mt-1 text-[13.5px] font-semibold text-muted">per page</p>
                  </div>
                  <p className="font-receipt text-[34px] font-bold text-ink leading-none">₹2</p>
                </div>
              }
              bottom={
                <div className="flex items-end justify-between py-1">
                  <div>
                    <p className="font-receipt text-[11px] font-bold tracking-[1.5px] text-muted">
                      DOUBLE-SIDED
                    </p>
                    <p className="mt-1 text-[13.5px] font-semibold text-muted">per sheet</p>
                  </div>
                  <p className="font-receipt text-[34px] font-bold text-ink leading-none">₹3</p>
                </div>
              }
            />
          </motion.div>
        </div>

        {/* right: the full tariff */}
        <motion.div variants={fadeSlideChild} className="lg:col-span-7 lg:pl-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h3 className="text-[17px] font-extrabold text-ink tracking-[-0.2px]">
              Full tariff
            </h3>
            <PillToggle
              options={[
                { value: 'A4', label: 'A4' },
                { value: 'A3', label: 'A3' },
                { value: 'A2', label: 'A2' },
              ]}
              value={size}
              onChange={setSize}
              className="w-[210px] shrink-0"
            />
          </div>
          <div className="card p-2">
            {rows.map((row) => (
              <div
                key={`${row.type}-${row.side}`}
                className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-line/60 last:border-0"
              >
                <span className="text-[14px] font-semibold text-ink">
                  {row.type === 'colour' ? 'Colour' : 'B&W'} ·{' '}
                  {row.side === 'double' ? 'Double-sided' : 'Single-sided'}
                </span>
                <span className="font-receipt text-[15px] font-bold text-ink">
                  ₹{row.price} / {row.side === 'double' ? 'sheet' : 'page'}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-receipt text-[12px] font-bold text-muted">
            RATES SET BY THE CAMPUS PRESS · UPDATED LIVE IN THE APP
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}

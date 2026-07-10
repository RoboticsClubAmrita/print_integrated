import { useState } from 'react'
import { motion } from 'motion/react'
import { PillToggle } from '@/components/ui/PillToggle'
import { PRICE_TABLE } from '@/lib/pricing'
import { fadeSlideChild, staggerParent } from '@/lib/motion'
import type { PaperSize } from '@/types'

export function PricingSection() {
  const [size, setSize] = useState<PaperSize>('A4')
  const rows = PRICE_TABLE.filter((r) => r.size === size)

  return (
    <section id="pricing" className="mx-auto max-w-[1180px] px-4 sm:px-6 py-20 sm:py-28">
      <motion.div
        variants={fadeSlideChild}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="text-center max-w-[560px] mx-auto mb-12"
      >
        <p className="text-[12.5px] font-bold text-success uppercase tracking-wide">Pricing</p>
        <h2 className="mt-2 text-[32px] sm:text-[40px] font-extrabold tracking-[-0.8px] text-ink leading-tight">
          Simple, transparent rates.
        </h2>
        <p className="mt-3 text-[15px] font-medium text-muted">
          No subscriptions, no hidden fees — pay only for what you print.
        </p>
      </motion.div>

      <motion.div
        variants={staggerParent(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid sm:grid-cols-2 gap-5 max-w-[560px] mx-auto mb-12"
      >
        <motion.div variants={fadeSlideChild} className="dark-panel relative overflow-hidden rounded-[24px] p-7 text-center">
          <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
          <p className="relative text-[13px] font-semibold text-white/50">Single-sided</p>
          <p className="relative mt-1 text-[36px] font-extrabold tracking-[-1px] text-white">₹2</p>
          <p className="relative text-[13px] font-medium text-white/60">per page</p>
        </motion.div>
        <motion.div variants={fadeSlideChild} className="card p-7 text-center">
          <p className="text-[13px] font-semibold text-muted">Double-sided</p>
          <p className="mt-1 text-[36px] font-extrabold tracking-[-1px] text-ink">₹3</p>
          <p className="text-[13px] font-medium text-muted">per sheet</p>
        </motion.div>
      </motion.div>

      <div className="max-w-[520px] mx-auto">
        <div className="flex justify-center mb-5">
          <PillToggle
            options={[
              { value: 'A4', label: 'A4' },
              { value: 'A3', label: 'A3' },
              { value: 'A2', label: 'A2' },
            ]}
            value={size}
            onChange={setSize}
            className="max-w-[280px]"
          />
        </div>
        <div className="card p-2">
          {rows.map((row) => (
            <div
              key={`${row.type}-${row.side}`}
              className="flex items-center justify-between px-4 py-3.5 border-b border-line/60 last:border-0"
            >
              <span className="text-[14px] font-semibold text-ink">
                {row.type === 'colour' ? 'Colour' : 'B&W'} •{' '}
                {row.side === 'double' ? 'Double-sided' : 'Single-sided'}
              </span>
              <span className="text-[14px] font-extrabold text-ink">
                ₹{row.price} / {row.side === 'double' ? 'sheet' : 'page'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

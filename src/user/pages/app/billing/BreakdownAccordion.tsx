import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, FileText, Image as ImageIcon } from 'lucide-react'
import type { Order } from '@/types'
import { orderCost, SIDE_LABELS } from '@/lib/orders'
import { fileExt } from '@/lib/format'
import { backendRateLabel, rateLabel, rupees } from '@/lib/pricing'
import { DUR, EASE } from '@/lib/motion'

function OrderRow({ order }: { order: Order }) {
  const ext = fileExt(order.fileName)
  const Icon = ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? ImageIcon : FileText
  const rate =
    order.costPerPage > 0
      ? `at ${backendRateLabel(order.costPerPage, order.side)}`
      : `at ${rateLabel(order.side)}`

  return (
    <div className="flex items-center gap-3 py-3 border-b border-line/60 last:border-0">
      <span className="grid place-items-center size-10 rounded-[12px] bg-chip shrink-0">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink truncate">{order.fileName}</p>
        <p className="text-[12px] font-medium text-muted mt-0.5">
          {order.pages} pages × {order.copies} {order.copies === 1 ? 'copy' : 'copies'} •{' '}
          {SIDE_LABELS[order.side]}
        </p>
        <p className="text-[12px] font-medium text-muted">
          {rate}
          {order.balanceApplied > 0 && ` + ${rupees(order.balanceApplied)} carried-over balance`}
        </p>
      </div>
      <span className="text-[14.5px] font-extrabold text-ink shrink-0">{rupees(orderCost(order))}</span>
    </div>
  )
}

/** Collapsible per-order cost breakdown for unpaid orders (billing_screen.dart). */
export function BreakdownAccordion({ orders }: { orders: Order[] }) {
  const [open, setOpen] = useState(false)
  if (orders.length === 0) return null

  return (
    <div className="card p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3"
      >
        <h2 className="text-[16px] font-extrabold tracking-[-0.2px] text-ink">Cost Breakdown</h2>
        <span className="flex items-center gap-2 text-[13px] font-bold text-muted">
          {orders.length} order{orders.length === 1 ? '' : 's'}
          <ChevronDown
            size={17}
            className="transition-transform duration-340"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR.normal, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-1 border-t border-line/70">
              {orders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

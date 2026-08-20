import { clsx } from 'clsx'
import type { Order } from '@/types'
import { colorModeLabel, isPaid, orderCost, SIDE_LABELS } from '@/lib/orders'
import { backendRateLabel, rupees } from '@/lib/pricing'

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-[14px]">
      <span className="font-medium text-muted">{label}</span>
      <span className={clsx('font-bold', muted ? 'text-muted' : 'text-ink')}>{value}</span>
    </div>
  )
}

/**
 * Cost Breakdown card (order_detail_screen.dart): paper/side/pages/copies,
 * the rate actually charged (or the local fallback label), the
 * carried-over balance row when present, and the Paid / Payment-due pill.
 */
export function CostBreakdown({ order }: { order: Order }) {
  const cost = orderCost(order)
  const paid = isPaid(order.status)
  const hasRealRate = order.costPerPage > 0

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[18px] font-extrabold tracking-[-0.2px]">Cost Breakdown</h2>
        <span
          className={clsx(
            'px-3 py-1 rounded-full text-[12px] font-bold',
            paid ? 'bg-success/12 text-success' : 'bg-warning/14 text-warning',
          )}
        >
          {paid ? 'Paid' : 'Payment due'}
        </span>
      </div>

      <div className="divide-y divide-line/70">
        <Row label="Paper" value={`${order.pageType} • ${colorModeLabel(order.colorMode)}`} />
        <Row label="Side" value={SIDE_LABELS[order.side]} />
        <Row label="Pages per copy" value={`${order.pages}`} />
        <Row label="Copies" value={`${order.copies}`} />
        {hasRealRate ? (
          <>
            <Row label="Rate charged" value={backendRateLabel(order.costPerPage, order.side)} />
            <Row label="Print cost" value={rupees(order.printCost)} />
          </>
        ) : (
          <Row label="Rate" value={order.side === 'SINGLE' ? '₹2 / page' : '₹3 / sheet'} />
        )}
        {order.balanceApplied > 0 && (
          <div className="py-2">
            <Row label="Outstanding balance added" value={rupees(order.balanceApplied)} />
            <p className="text-[12px] font-medium text-muted leading-relaxed mt-0.5">
              Carried over from uncollected prints left in a stack past the free window — paying
              this invoice clears it.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 mt-1 border-t-2 border-dashed border-line">
        <span className="text-[15px] font-extrabold text-ink">Total</span>
        <span className="text-[20px] font-extrabold tracking-[-0.4px] text-ink">{rupees(cost)}</span>
      </div>
    </div>
  )
}

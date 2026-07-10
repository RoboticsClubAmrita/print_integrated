import { CheckCircle2 } from 'lucide-react'
import type { Order } from '@/types'
import { orderCost } from '@/lib/orders'
import { formatDayDate } from '@/lib/format'
import { rupees } from '@/lib/pricing'

/** Paid-orders ledger (billing_screen.dart's Payment History list). */
export function PaymentHistory({ orders }: { orders: Order[] }) {
  return (
    <div className="card p-6">
      <h2 className="text-[16px] font-extrabold tracking-[-0.2px] text-ink mb-4">
        Payment History
      </h2>
      {orders.length === 0 ? (
        <p className="text-[13.5px] font-semibold text-muted py-2">No payments yet.</p>
      ) : (
        <div>
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 py-3 border-b border-line/60 last:border-0"
            >
              <CheckCircle2 size={18} className="text-success shrink-0" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink truncate">{o.fileName}</p>
                <p className="text-[12px] font-medium text-muted mt-0.5">
                  {formatDayDate(o.createdAt)}
                </p>
              </div>
              <span className="text-[14.5px] font-extrabold text-ink shrink-0">
                {rupees(orderCost(o))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

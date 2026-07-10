import { FileText, Image as ImageIcon } from 'lucide-react'
import { TicketCard } from '@/components/app/TicketCard'
import { StatusChip } from '@/components/app/StatusChip'
import type { Order } from '@/types'
import { orderCost } from '@/lib/orders'
import { fileExt, formatDateShort } from '@/lib/format'
import { rupees } from '@/lib/pricing'

function MetaChip({ children }: { children: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full border border-line/80 bg-white px-2.5 py-1 text-[11.5px] font-bold text-muted">
      {children}
    </span>
  )
}

/**
 * Deterministic mini barcode drawn from the order id — a print-craft
 * flourish that makes every ticket subtly unique.
 */
function Barcode({ seed }: { seed: string }) {
  return (
    <span aria-hidden className="flex h-5 items-stretch gap-[2px]">
      {Array.from({ length: 18 }, (_, i) => {
        const code = seed.charCodeAt(i % seed.length) + i * 7
        return (
          <span
            key={i}
            className="rounded-[1px] bg-ink"
            style={{ width: code % 3 === 0 ? 3 : 1.5, opacity: code % 4 === 0 ? 0.25 : 0.75 }}
          />
        )
      })}
    </span>
  )
}

/** Boarding-pass ticket for the orders list (orders_screen.dart's TicketCard usage). */
export function OrderTicket({ order, onClick }: { order: Order; onClick: () => void }) {
  const ext = fileExt(order.fileName)
  const Icon = ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? ImageIcon : FileText

  return (
    <TicketCard
      onClick={onClick}
      top={
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-ink text-white shadow-[0_4px_10px_rgb(11_11_13_/_0.25)]">
            <Icon size={19} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{order.fileName}</p>
            <p className="mt-0.5 text-[12px] font-medium text-muted">
              {order.id} • {order.fileSizeKb} KB
            </p>
          </div>
          <StatusChip status={order.status} />
        </div>
      }
      bottom={
        <div className="flex items-center justify-between gap-3">
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            <MetaChip>{formatDateShort(order.scheduledFor ?? order.createdAt)}</MetaChip>
            <MetaChip>{`${order.pages} pg × ${order.copies}`}</MetaChip>
            <MetaChip>{order.side === 'SINGLE' ? '1-side' : '2-side'}</MetaChip>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Barcode seed={order.id} />
            <span className="text-[16px] font-extrabold tabular-nums text-ink">
              {rupees(orderCost(order))}
            </span>
          </div>
        </div>
      }
    />
  )
}

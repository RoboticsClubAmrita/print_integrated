import { clsx } from 'clsx'
import type { OrderStatus } from '@/types'
import { STATUS_CHIP, STATUS_LABELS } from '@/lib/orders'

const DOT = { muted: 'bg-muted', warning: 'bg-warning', success: 'bg-success' }

/**
 * Status dot + label (status_chip.dart). Attention states (printing /
 * ready / failed) are emphasized with the filled black chip; PRINTING's
 * dot pulses.
 */
export function StatusChip({ status, className }: { status: OrderStatus; className?: string }) {
  const { tone, filled } = STATUS_CHIP[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[20px] text-[12px] font-bold whitespace-nowrap',
        filled ? 'bg-ink text-white' : 'bg-chip text-ink',
        className,
      )}
    >
      <span
        className={clsx(
          'size-[7px] rounded-full shrink-0',
          DOT[tone],
          status === 'PRINTING' && 'animate-pulse-dot',
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  )
}

import { motion } from 'motion/react'
import { Check, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { OrderStatus } from '@/types'
import { TIMELINE_NODES, timelineIndex, timelineNodeLabel } from '@/lib/orders'
import { EASE } from '@/lib/motion'

/**
 * Five-node vertical order timeline (order_detail_screen.dart).
 * PRINTED_PENDING_STACK collapses onto the "Ready" node (relabeled),
 * SCHEDULED onto the first; CANCELLED / FAILED show a message row instead.
 * Connector fills animate top-down as the simulation advances the status.
 * `onDark` swaps the ink-on-paper palette for paper-on-ink so the same
 * component stays legible on dark-panel surfaces (landing demo).
 */
export function StatusTimeline({ status, onDark = false }: { status: OrderStatus; onDark?: boolean }) {
  const idx = timelineIndex(status)

  if (idx === -1) {
    return (
      <div className="flex items-center gap-3 py-1">
        <XCircle size={22} className={clsx('shrink-0', onDark ? 'text-white/55' : 'text-muted')} />
        <p className={clsx('text-[14.5px] font-bold', onDark ? 'text-white' : 'text-ink')}>
          {status === 'CANCELLED' ? 'This order was cancelled.' : 'This order failed to print.'}
        </p>
      </div>
    )
  }

  return (
    <ol className="m-0 p-0 list-none">
      {TIMELINE_NODES.map((_, i) => {
        const reached = i <= idx
        const current = i === idx
        const label = timelineNodeLabel(i, status)
        return (
          <li key={i} className="relative flex items-start gap-4 pb-8 last:pb-0">
            {i < TIMELINE_NODES.length - 1 && (
              <span
                aria-hidden
                className={clsx(
                  'absolute left-[10px] top-[26px] bottom-1 w-[2px] rounded overflow-hidden',
                  onDark ? 'bg-white/15' : 'bg-line',
                )}
              >
                <motion.span
                  className={clsx('absolute inset-0 origin-top', onDark ? 'bg-white' : 'bg-ink')}
                  initial={false}
                  animate={{ scaleY: i < idx ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                />
              </span>
            )}
            <span
              className={clsx(
                'relative grid place-items-center size-[22px] rounded-full border-2 shrink-0 transition-colors duration-340',
                reached
                  ? onDark
                    ? 'bg-white border-white text-ink'
                    : 'bg-ink border-ink text-white'
                  : onDark
                    ? 'bg-white/10 border-white/25'
                    : 'bg-chip border-line',
              )}
              style={
                current
                  ? {
                      boxShadow: onDark
                        ? '0 0 0 5px rgb(255 255 255 / 0.14)'
                        : '0 0 0 5px rgb(11 11 13 / 0.08)',
                    }
                  : undefined
              }
            >
              {reached && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="min-w-0 -mt-0.5">
              <span
                className={clsx(
                  'block text-[14.5px] transition-colors duration-340',
                  current
                    ? clsx('font-extrabold', onDark ? 'text-white' : 'text-ink')
                    : reached
                      ? clsx('font-bold', onDark ? 'text-white/85' : 'text-ink/80')
                      : clsx('font-semibold', onDark ? 'text-white/55' : 'text-muted'),
                )}
              >
                {label}
              </span>
              {current && (
                <span
                  className={clsx(
                    'block text-[11.5px] font-medium mt-0.5',
                    onDark ? 'text-white/50' : 'text-muted',
                  )}
                >
                  Current status
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

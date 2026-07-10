import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { clsx } from 'clsx'

/** Honest empty state: dark dot-grid tile + copy + optional action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  onDark = false,
  className,
}: {
  icon: LucideIcon
  title: string
  body?: string
  action?: ReactNode
  onDark?: boolean
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col items-center text-center py-12 px-6', className)}>
      <div className="dark-panel relative overflow-hidden rounded-[24px] size-[72px] grid place-items-center">
        <div aria-hidden className="absolute inset-0 bg-dots" />
        <Icon className="relative text-white/80" size={30} strokeWidth={1.8} />
      </div>
      <p
        className={clsx(
          'mt-5 text-[16px] font-extrabold tracking-[-0.2px]',
          onDark ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </p>
      {body && (
        <p className={clsx('mt-1.5 text-[13.5px] max-w-[260px]', onDark ? 'text-white/60' : 'text-muted')}>
          {body}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

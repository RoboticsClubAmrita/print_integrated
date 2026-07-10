import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export function SectionHeading({
  title,
  action,
  onDark = false,
  className,
}: {
  title: string
  action?: ReactNode
  onDark?: boolean
  className?: string
}) {
  return (
    <div className={clsx('flex items-center justify-between gap-4', className)}>
      <h2
        className={clsx(
          'text-[18px] font-extrabold tracking-[-0.2px]',
          onDark ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {action}
    </div>
  )
}

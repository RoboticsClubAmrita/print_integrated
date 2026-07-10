import { clsx } from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx('block rounded-[12px] bg-line/60 animate-shimmer', className)}
    />
  )
}

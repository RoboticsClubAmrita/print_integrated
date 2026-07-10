import type { ReactNode } from 'react'
import { clsx } from 'clsx'

/**
 * The signature top-lit dark gradient surface with optional dot-grid
 * texture. The dots live on their own layer — the gradient and the
 * radial-gradient texture are both background-images and would otherwise
 * override each other.
 */
export function DarkPanel({
  children,
  dots = true,
  className,
}: {
  children: ReactNode
  dots?: boolean
  className?: string
}) {
  return (
    <div className={clsx('dark-panel relative overflow-hidden rounded-[28px]', className)}>
      {dots && <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />}
      <div className="relative">{children}</div>
    </div>
  )
}

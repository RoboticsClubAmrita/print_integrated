import { clsx } from 'clsx'

/** Monochrome spinning ring (matches the app's upload ring aesthetic). */
export function Spinner({
  size = 18,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        'inline-block rounded-full border-2 border-current border-t-transparent animate-spin-ring shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
    />
  )
}

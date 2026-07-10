import { AppIcon } from '@/components/brand/AppIcon'
import { clsx } from 'clsx'

/** Logo lockup: icon tile + "PrintEase" wordmark (19px w800, −0.4 tracking). */
export function BrandMark({
  onDark = false,
  size = 40,
  className,
}: {
  onDark?: boolean
  size?: number
  className?: string
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5 select-none', className)}>
      <AppIcon size={size} />
      <span
        className={clsx(
          'font-extrabold tracking-[-0.4px] text-[19px] leading-none',
          onDark ? 'text-white' : 'text-ink',
        )}
      >
        PrintEase
      </span>
    </span>
  )
}

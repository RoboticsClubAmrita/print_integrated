import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

type Variant = 'plain' | 'chip' | 'outline' | 'onDark'

const VARIANTS: Record<Variant, string> = {
  plain: 'bg-transparent text-ink hover:bg-chip',
  chip: 'bg-chip text-ink hover:bg-line/70',
  outline: 'bg-white border border-line text-ink hover:bg-chip hover:border-muted/40',
  onDark: 'bg-white/10 border border-white/12 text-white hover:bg-white/15',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  variant?: Variant
  badge?: number
  size?: number
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'chip',
  badge,
  size = 44,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'press relative grid place-items-center rounded-full transition-colors duration-180 disabled:opacity-40',
        VARIANTS[variant],
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon size={Math.round(size * 0.44)} strokeWidth={2} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-ink text-white text-[9.5px] font-extrabold tabular-nums grid place-items-center ring-2 ring-bg">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

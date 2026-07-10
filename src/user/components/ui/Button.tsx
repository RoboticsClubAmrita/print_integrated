import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Spinner'

type Variant = 'primary' | 'onDark' | 'outline' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft',
  onDark: 'bg-white text-ink hover:bg-white/90',
  outline: 'bg-white text-ink border-[1.5px] border-line hover:border-muted/60',
  ghost: 'bg-transparent text-ink hover:bg-chip',
  danger: 'bg-white text-danger border-[1.5px] border-danger/25 hover:bg-danger/5',
}

const SIZES: Record<Size, string> = {
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-[16px]',
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: LucideIcon
  trailingIcon?: LucideIcon
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  icon: Icon,
  trailingIcon: TrailingIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'press inline-flex items-center justify-center gap-2.5 rounded-[16px] font-bold tracking-[0.1px]',
        'transition-colors duration-180 disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 18 : 16} /> : Icon && <Icon size={size === 'lg' ? 19 : 17} strokeWidth={2.2} />}
      <span>{children}</span>
      {TrailingIcon && !loading && <TrailingIcon size={size === 'lg' ? 19 : 17} strokeWidth={2.2} />}
    </button>
  )
}

import { useId, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Filled chip-style input (the app's borderless field: chip fill at rest,
 * white + 1.6px ink border when focused). Password fields get a built-in
 * visibility toggle.
 */
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  hint,
  icon: Icon,
  autoFocus,
  autoComplete,
  disabled,
  onSubmit,
  transform,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'tel'
  placeholder?: string
  error?: string | null
  hint?: string
  icon?: LucideIcon
  autoFocus?: boolean
  autoComplete?: string
  disabled?: boolean
  onSubmit?: () => void
  /** Input filter/transform applied on every change (e.g. phone chars, uppercase). */
  transform?: (value: string) => string
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (visible ? 'text' : 'password') : type

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-[12.5px] font-semibold text-muted mb-1.5 pl-1">
        {label}
      </label>
      <div
        className={clsx(
          'flex items-center gap-3 h-14 px-4 rounded-[22px] border-[1.6px] transition-all duration-200',
          error
            ? 'border-danger bg-white shadow-[0_0_0_4px_rgb(255_69_58_/_0.08)]'
            : focused
              ? 'border-ink bg-white shadow-[0_0_0_4px_rgb(11_11_13_/_0.06)]'
              : 'border-transparent bg-chip hover:bg-line/60',
          disabled && 'opacity-50',
        )}
      >
        {Icon && <Icon size={19} strokeWidth={2} className="text-muted shrink-0" />}
        <input
          id={id}
          type={inputType}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(transform ? transform(e.target.value) : e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) onSubmit()
          }}
          aria-invalid={!!error}
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px] font-bold text-ink placeholder:text-muted/70 placeholder:font-medium"
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((v) => !v)}
            className="text-muted hover:text-ink transition-colors shrink-0 p-1 -m-1"
          >
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 pl-1 text-[12.5px] font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 pl-1 text-[12.5px] font-medium text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

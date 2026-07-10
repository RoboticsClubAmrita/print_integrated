import { useId } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { DUR, EASE } from '@/lib/motion'

export interface PillOption<T extends string> {
  value: T
  label: string
}

/**
 * Segmented control with a sliding thumb (pill_toggle.dart): the thumb
 * glides between options via a shared-layout animation.
 */
export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  onDark = false,
  className,
}: {
  options: PillOption<T>[]
  value: T
  onChange: (value: T) => void
  onDark?: boolean
  className?: string
}) {
  const id = useId()
  const selectedIndex = options.findIndex((o) => o.value === value)

  return (
    <div
      role="radiogroup"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          onChange(options[(selectedIndex + 1) % options.length].value)
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          onChange(options[(selectedIndex - 1 + options.length) % options.length].value)
        }
      }}
      className={clsx(
        'flex h-[54px] p-[5px] rounded-[17px] border',
        onDark ? 'bg-white/10 border-white/12' : 'bg-chip border-line/60',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className="relative flex-1 rounded-[13px] outline-offset-4"
          >
            {active && (
              <motion.span
                layoutId={`${id}-thumb`}
                transition={{ duration: DUR.normal, ease: EASE }}
                className={clsx(
                  'absolute inset-0 rounded-[13px] shadow-thumb',
                  onDark ? 'bg-white' : 'bg-ink',
                )}
              />
            )}
            <span
              className={clsx(
                'relative z-10 text-[14.5px] font-bold transition-colors duration-250',
                active
                  ? onDark
                    ? 'text-ink'
                    : 'text-white'
                  : onDark
                    ? 'text-white/70'
                    : 'text-muted',
              )}
            >
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

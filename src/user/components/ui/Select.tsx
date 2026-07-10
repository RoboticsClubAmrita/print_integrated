import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { DUR, EASE } from '@/lib/motion'

export interface SelectOption {
  value: string
  label: string
  icon?: LucideIcon
}

/** Custom listbox styled to the brand (native selects can't be). */
export function Select({
  options,
  value,
  onChange,
  placeholder = 'Choose…',
  label,
  onDark = false,
  className,
}: {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  onDark?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      {label && (
        <span
          className={clsx(
            'block text-[12.5px] font-semibold mb-1.5 pl-1',
            onDark ? 'text-white/60' : 'text-muted',
          )}
        >
          {label}
        </span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'press-soft flex items-center gap-3 w-full h-14 px-4 rounded-[22px] text-left transition-colors duration-180',
          onDark
            ? 'bg-white/10 border border-white/12 text-white hover:bg-white/15'
            : 'bg-chip text-ink hover:bg-[#ececef]',
        )}
      >
        {selected?.icon && <selected.icon size={18} className={onDark ? 'text-white/70' : 'text-muted'} />}
        <span
          className={clsx(
            'flex-1 truncate text-[15px] font-bold',
            !selected && (onDark ? 'text-white/50' : 'text-muted'),
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={clsx(
            'shrink-0 transition-transform duration-340',
            open && 'rotate-180',
            onDark ? 'text-white/70' : 'text-muted',
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2 }}
            transition={{ duration: DUR.fast, ease: EASE }}
            className="absolute z-40 mt-2 w-full origin-top bg-white rounded-[20px] border border-line shadow-lift p-1.5 max-h-64 overflow-y-auto"
          >
            {options.map((option) => {
              const active = option.value === value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={clsx(
                      'flex items-center gap-3 w-full text-left rounded-[14px] px-3.5 py-3 text-[15px] font-bold transition-colors',
                      active ? 'bg-chip text-ink' : 'text-ink hover:bg-chip/70',
                    )}
                  >
                    {option.icon && <option.icon size={17} className="text-muted" />}
                    <span className="flex-1 truncate">{option.label}</span>
                    {active && <Check size={16} strokeWidth={2.5} />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

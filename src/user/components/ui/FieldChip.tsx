import { AnimatePresence, motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { EASE } from '@/lib/motion'

/**
 * Grey rounded form chip: small label over a bold value, with an optional
 * trailing icon tile (field_chip.dart). Value changes animate with a
 * fade + slide-up switcher.
 */
export function FieldChip({
  label,
  value,
  valueIsPlaceholder = false,
  trailingIcon: TrailingIcon,
  onClick,
  disabled,
  className,
}: {
  label: string
  value: string
  valueIsPlaceholder?: boolean
  trailingIcon?: LucideIcon
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const interactive = !!onClick && !disabled
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      {...(interactive ? { type: 'button' as const, onClick } : {})}
      className={clsx(
        'flex items-center gap-3 bg-chip rounded-[22px] px-[18px] py-[14px] w-full text-left',
        interactive && 'press-soft hover:bg-[#ececef] transition-colors duration-180 cursor-pointer',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-muted">{label}</div>
        <div className="overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 9 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.26, ease: EASE }}
              className={clsx(
                'text-[16px] font-bold truncate',
                valueIsPlaceholder ? 'text-muted' : 'text-ink',
              )}
            >
              {value}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {TrailingIcon && (
        <span className="grid place-items-center size-[38px] rounded-[12px] bg-white border border-line shrink-0">
          <TrailingIcon size={18} strokeWidth={2} className="text-ink" />
        </span>
      )}
    </Tag>
  )
}

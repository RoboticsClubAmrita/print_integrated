import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { EASE_BACK } from '@/lib/motion'

function RoundButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Minus
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'grid place-items-center size-[31px] rounded-full transition-all duration-110 active:scale-[0.88]',
        disabled ? 'bg-line text-muted' : 'bg-ink text-white hover:bg-ink-soft',
      )}
    >
      <Icon size={16} strokeWidth={2.5} />
    </button>
  )
}

/** Grey chip with label + stepper controls (StepperChip in the app). */
export function StepperChip({
  label,
  value,
  min = 1,
  max,
  onChange,
  className,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 bg-chip rounded-[22px] px-[18px] py-[14px]',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-muted">{label}</div>
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={value}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_BACK }}
              className="text-[16px] font-bold text-ink tabular-nums"
            >
              {value}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RoundButton icon={Minus} label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} />
        <RoundButton icon={Plus} label={`Increase ${label}`} disabled={max !== undefined && value >= max} onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)} />
      </div>
    </div>
  )
}

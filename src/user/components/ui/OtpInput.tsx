import { useRef } from 'react'
import { clsx } from 'clsx'

/**
 * Row of individual OTP digit boxes (otp_input.dart): auto-advance on
 * entry, backspace on an empty box clears + refocuses the previous one,
 * paste distributes digits. Fires onComplete when the last digit lands.
 */
export function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  error = false,
}: {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  error?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const commit = (next: string[]) => {
    const joined = next.join('')
    onChange(joined)
    if (joined.length === length && onComplete) onComplete(joined)
  }

  const setDigit = (index: number, char: string) => {
    const next = [...digits]
    next[index] = char
    commit(next)
  }

  const distribute = (from: number, chars: string) => {
    const next = [...digits]
    let cursor = from
    for (const c of chars) {
      if (cursor >= length) break
      next[cursor++] = c
    }
    commit(next)
    refs.current[Math.min(cursor, length - 1)]?.focus()
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '')
    if (cleaned.length === 0) {
      setDigit(index, '')
      return
    }
    if (cleaned.length > 1) {
      distribute(index, cleaned)
      return
    }
    setDigit(index, cleaned)
    refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      commit(next)
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-3.5" role="group" aria-label="One-time code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length /* allow paste of the full code into one box */}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault()
            distribute(i, e.clipboardData.getData('text').replace(/\D/g, ''))
          }}
          onFocus={(e) => e.target.select()}
          className={clsx(
            'w-[58px] h-[64px] rounded-[16px] text-center text-[24px] font-extrabold text-ink caret-ink',
            'outline-none transition-colors duration-180 border-[1.5px]',
            'focus:bg-white focus:border-ink focus:border-[1.8px]',
            error
              ? 'border-danger bg-white'
              : digit
                ? 'border-ink bg-white'
                : 'border-line bg-chip',
            disabled && 'opacity-50',
          )}
        />
      ))}
    </div>
  )
}

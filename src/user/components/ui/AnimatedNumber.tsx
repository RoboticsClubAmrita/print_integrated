import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { rupees } from '@/lib/pricing'

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/**
 * Tweens numeric text from its previous value over 340ms easeOutQuart —
 * the AnimatedCount pattern from the Flutter app, used for money values.
 */
export function AnimatedNumber({
  value,
  format = rupees,
  duration = 340,
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const current = Math.round(from + (value - from) * easeOutQuart(t))
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = value
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value, duration])

  return <span className={clsx('tabular-nums', className)}>{format(display)}</span>
}

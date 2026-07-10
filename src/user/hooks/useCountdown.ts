import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Deadline-based countdown (StrictMode-safe: remaining time derives from a
 * stored deadline timestamp instead of decrementing state).
 */
export function useCountdown(initialSeconds: number) {
  const deadlineRef = useRef<number>(Date.now() + initialSeconds * 1000)
  const [remaining, setRemaining] = useState(initialSeconds)

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      setRemaining(left)
    }, 250)
    return () => clearInterval(timer)
  }, [])

  const restart = useCallback((seconds: number = initialSeconds) => {
    deadlineRef.current = Date.now() + seconds * 1000
    setRemaining(seconds)
  }, [initialSeconds])

  return { remaining, done: remaining <= 0, restart }
}

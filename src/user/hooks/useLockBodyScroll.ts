import { useEffect } from 'react'

let locks = 0

/** Locks body scroll while `active` (ref-counted across stacked overlays). */
export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return
    locks++
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      locks--
      if (locks <= 0) {
        document.body.style.overflow = prev
        locks = 0
      }
    }
  }, [active])
}

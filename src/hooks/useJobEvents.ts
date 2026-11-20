import { useEffect, useRef } from 'react'
import { subscribeJobEvents, type JobEvent } from '../services/jobEvents'

/**
 * A single status change often lands as a short burst of events (assigning a
 * stack updates the job, then promotes the next one), so callers get one
 * refetch per burst instead of one per row.
 */
const COALESCE_MS = 250

/**
 * Calls `onChange` shortly after the backend announces a print-job change
 * (or after the live feed reconnects and may have missed some).
 *
 * `onChange` may change identity every render; the latest one is always
 * used, and the subscription itself is only reopened when `enabled` flips.
 */
export function useJobEvents(onChange: (events: JobEvent[]) => void, enabled = true): void {
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  })

  useEffect(() => {
    if (!enabled) return
    let pending: JobEvent[] = []
    let timer: number | null = null

    const unsubscribe = subscribeJobEvents((event) => {
      pending.push(event)
      if (timer !== null) return
      timer = window.setTimeout(() => {
        timer = null
        const batch = pending
        pending = []
        latest.current(batch)
      }, COALESCE_MS)
    })

    return () => {
      unsubscribe()
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [enabled])
}

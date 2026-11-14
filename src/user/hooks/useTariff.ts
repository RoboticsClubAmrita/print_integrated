import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import type { PriceRow } from '@/types'

/**
 * The live tariff for screens that only display rates (landing page, Print
 * Rates sheet). Re-reads on mount so an admin edit shows up on the next visit;
 * a failed load leaves the last known rates — or the empty state — in place.
 */
export function useTariff(): { prices: PriceRow[]; loaded: boolean } {
  const prices = useAppStore((s) => s.prices)
  const loaded = useAppStore((s) => s.pricesLoaded)
  const loadPrices = useAppStore((s) => s.loadPrices)

  useEffect(() => {
    loadPrices().catch(() => {})
  }, [loadPrices])

  return { prices, loaded }
}

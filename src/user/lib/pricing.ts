/**
 * Print pricing. Every rate comes from the backend's live tariff
 * (`GET /pricing/all`, edited in the admin console's Pricing & Rules) — there
 * is no client-side price table, so what an order screen shows is what the
 * backend will charge. The formula mirrors `billableUnits` in the backend's
 * jobModule: single-sided is billed per page, double-sided per sheet.
 */
import type { ColorMode, PaperSize, PriceRow, PrintSide } from '@/types'

export const PAPER_SIZES: readonly PaperSize[] = ['A4', 'A3', 'A2']

export function sheetsPerCopy(pages: number, side: PrintSide): number {
  return side === 'SINGLE' ? pages : Math.ceil(pages / 2)
}

/**
 * The tariff rate (₹ per page single-sided, ₹ per sheet double-sided) for an
 * order's choices, or null when the admin has not priced that combination —
 * the backend refuses such an order, so the UI must not offer a price for it.
 */
export function rateFor(
  prices: readonly PriceRow[],
  size: PaperSize,
  colorMode: ColorMode,
  side: PrintSide,
): number | null {
  const type = colorMode === 'COLOR' ? 'colour' : 'bw'
  const tariffSide = side === 'DOUBLE' ? 'double' : 'single'
  const row = prices.find((r) => r.size === size && r.type === type && r.side === tariffSide)
  return row ? row.price : null
}

/** copies × billable units × rate, rounded to paise like the backend. */
export function printCost(opts: {
  pages: number
  copies: number
  side: PrintSide
  rate: number
}): number {
  const { pages, copies, side, rate } = opts
  if (pages <= 0 || copies <= 0 || rate <= 0) return 0
  return Math.round(copies * sheetsPerCopy(pages, side) * rate * 100) / 100
}

/** Double-sided prices are per SHEET (two pages share one), so say so. */
export function rateLabel(rate: number, side: PrintSide): string {
  return side === 'SINGLE' ? `₹${rate} / page` : `₹${rate} / sheet`
}

export function rupees(amount: number): string {
  return `₹${amount}`
}

const SIZES = new Set<string>(PAPER_SIZES)
const TYPES = new Set(['bw', 'colour'])
const SIDES = new Set(['single', 'double'])

/**
 * Reads `GET /pricing/all` (`{ prices: [...] }`, or the bare array) into
 * tariff rows. Inactive rows are dropped because the backend's job pricing
 * only charges active ones; anything malformed is dropped rather than shown.
 */
export function parsePrices(data: unknown): PriceRow[] {
  const raw = Array.isArray(data)
    ? data
    : ((data as { prices?: unknown } | null | undefined)?.prices ?? [])
  if (!Array.isArray(raw)) return []
  return raw.flatMap((r: Record<string, unknown>) => {
    const active = r?.isActive ?? r?.is_active ?? true
    const price = Number(r?.price)
    if (
      active === false ||
      !SIZES.has(String(r?.size)) ||
      !TYPES.has(String(r?.type)) ||
      !SIDES.has(String(r?.side)) ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return []
    }
    return [
      {
        size: r.size as PaperSize,
        type: r.type as PriceRow['type'],
        side: r.side as PriceRow['side'],
        price,
      },
    ]
  })
}

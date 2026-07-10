/**
 * Print rates in rupees — ported from lib/data/pricing.dart.
 * A4/BW single/double are the canonical app rates; every other row of the
 * rates table is an invented mock value for the static demo (the real app
 * fetches these from the backend's price list).
 */
import type { PaperSize, PriceRow, PrintSide } from '@/types'

export const SINGLE_SIDED_PER_PAGE = 2 // ₹2 / page
export const DOUBLE_SIDED_PER_SHEET = 3 // ₹3 / sheet (2 pages per sheet)

export function sheetsPerCopy(pages: number, side: PrintSide): number {
  return side === 'SINGLE' ? pages : Math.ceil(pages / 2)
}

export function printCost(opts: { pages: number; copies: number; side: PrintSide }): number {
  const { pages, copies, side } = opts
  if (pages <= 0 || copies <= 0) return 0
  const perCopy =
    side === 'SINGLE'
      ? pages * SINGLE_SIDED_PER_PAGE
      : Math.ceil(pages / 2) * DOUBLE_SIDED_PER_SHEET
  return copies * perCopy
}

export function rateLabel(side: PrintSide): string {
  return side === 'SINGLE'
    ? `₹${SINGLE_SIDED_PER_PAGE} / page`
    : `₹${DOUBLE_SIDED_PER_SHEET} / sheet`
}

export function rupees(amount: number): string {
  return `₹${amount}`
}

/** Full mock rates table: size × type × side (12 rows). */
export const PRICE_TABLE: PriceRow[] = [
  { size: 'A4', type: 'bw', side: 'single', price: 2 }, // canonical
  { size: 'A4', type: 'bw', side: 'double', price: 3 }, // canonical
  { size: 'A4', type: 'colour', side: 'single', price: 10 },
  { size: 'A4', type: 'colour', side: 'double', price: 18 },
  { size: 'A3', type: 'bw', side: 'single', price: 4 },
  { size: 'A3', type: 'bw', side: 'double', price: 6 },
  { size: 'A3', type: 'colour', side: 'single', price: 20 },
  { size: 'A3', type: 'colour', side: 'double', price: 36 },
  { size: 'A2', type: 'bw', side: 'single', price: 8 },
  { size: 'A2', type: 'bw', side: 'double', price: 12 },
  { size: 'A2', type: 'colour', side: 'single', price: 40 },
  { size: 'A2', type: 'colour', side: 'double', price: 72 },
]

export function lookupRate(
  size: PaperSize,
  type: 'bw' | 'colour',
  side: 'single' | 'double',
): number {
  const row = PRICE_TABLE.find((r) => r.size === size && r.type === type && r.side === side)
  return row ? row.price : SINGLE_SIDED_PER_PAGE
}

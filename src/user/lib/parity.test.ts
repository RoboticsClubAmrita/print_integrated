/**
 * Parity tests locking the 1:1 ports to the Flutter app's behavior,
 * including exact user-facing error strings.
 */
import { describe, expect, it } from 'vitest'
import { formatPageRange, parsePageRange } from '@/lib/pageRange'
import { parsePrices, printCost, rateFor, rateLabel, rupees, sheetsPerCopy } from '@/lib/pricing'
import type { PriceRow } from '@/types'
import { isAmritaEmail, isValidPhone, passwordIssue } from '@/lib/validators'
import { initials } from '@/lib/format'

describe('parsePageRange', () => {
  it('blank or "all" returns every page', () => {
    expect(parsePageRange('', 4)).toEqual([1, 2, 3, 4])
    expect(parsePageRange('  ', 3)).toEqual([1, 2, 3])
    expect(parsePageRange('ALL', 2)).toEqual([1, 2])
  })

  it('parses lists, ranges, dedupes and sorts', () => {
    expect(parsePageRange('1-5, 8, 11-13', 20)).toEqual([1, 2, 3, 4, 5, 8, 11, 12, 13])
    expect(parsePageRange('3, 1-3, 2', 5)).toEqual([1, 2, 3])
    expect(parsePageRange(' 2 - 4 ', 5)).toEqual([2, 3, 4])
  })

  it('throws exact error messages', () => {
    expect(() => parsePageRange('12', 8)).toThrowError(
      "Page 12 is beyond the document's 8 pages",
    )
    expect(() => parsePageRange('5-12', 8)).toThrowError(
      "Page 12 is beyond the document's 8 pages",
    )
    expect(() => parsePageRange('5-2', 8)).toThrowError('Invalid range "5-2"')
    expect(() => parsePageRange('1-2-3', 8)).toThrowError('Invalid range "1-2-3"')
    expect(() => parsePageRange('0', 8)).toThrowError('Invalid page "0"')
    expect(() => parsePageRange('abc', 8)).toThrowError('Invalid page "abc"')
    expect(() => parsePageRange(',', 8)).toThrowError('Enter at least one page')
  })

  it('formatPageRange compresses runs', () => {
    expect(formatPageRange([1, 2, 3, 5, 8, 9])).toBe('1-3, 5, 8-9')
    expect(formatPageRange([4])).toBe('4')
    expect(formatPageRange([])).toBe('')
  })
})

// The live tariff from the admin console (Pricing & Rules).
const TARIFF: PriceRow[] = [
  { size: 'A4', type: 'bw', side: 'single', price: 2 },
  { size: 'A4', type: 'bw', side: 'double', price: 3 },
  { size: 'A4', type: 'colour', side: 'single', price: 10 },
  { size: 'A4', type: 'colour', side: 'double', price: 18 },
  { size: 'A3', type: 'bw', side: 'single', price: 4 },
  { size: 'A3', type: 'bw', side: 'double', price: 7 },
  { size: 'A3', type: 'colour', side: 'single', price: 20 },
  { size: 'A3', type: 'colour', side: 'double', price: 36 },
  { size: 'A2', type: 'bw', side: 'single', price: 8 },
  { size: 'A2', type: 'bw', side: 'double', price: 15 },
  { size: 'A2', type: 'colour', side: 'single', price: 40 },
  { size: 'A2', type: 'colour', side: 'double', price: 72 },
]

describe('pricing', () => {
  it('picks the rate for the exact size × colour × side', () => {
    expect(rateFor(TARIFF, 'A4', 'BW', 'SINGLE')).toBe(2)
    expect(rateFor(TARIFF, 'A4', 'COLOR', 'DOUBLE')).toBe(18)
    expect(rateFor(TARIFF, 'A3', 'BW', 'DOUBLE')).toBe(7)
    expect(rateFor(TARIFF, 'A2', 'COLOR', 'SINGLE')).toBe(40)
  })

  it('returns null for a combination the admin has not priced', () => {
    expect(rateFor(TARIFF.filter((r) => r.size !== 'A2'), 'A2', 'BW', 'SINGLE')).toBeNull()
    expect(rateFor([], 'A4', 'BW', 'SINGLE')).toBeNull()
  })

  it('bills like the backend: copies × pages (or sheets when duplex) × rate', () => {
    expect(printCost({ pages: 8, copies: 2, side: 'SINGLE', rate: 2 })).toBe(32)
    expect(printCost({ pages: 5, copies: 1, side: 'DOUBLE', rate: 3 })).toBe(9) // ceil(5/2)=3 sheets
    expect(printCost({ pages: 5, copies: 2, side: 'DOUBLE', rate: 36 })).toBe(216) // A3 colour duplex
    expect(printCost({ pages: 3, copies: 1, side: 'SINGLE', rate: 2.5 })).toBe(7.5)
    expect(printCost({ pages: 0, copies: 3, side: 'SINGLE', rate: 2 })).toBe(0)
    expect(printCost({ pages: 3, copies: 0, side: 'DOUBLE', rate: 3 })).toBe(0)
    expect(sheetsPerCopy(5, 'DOUBLE')).toBe(3)
    expect(sheetsPerCopy(5, 'SINGLE')).toBe(5)
  })

  it('reads the backend price list, skipping inactive and malformed rows', () => {
    const rows = parsePrices({
      prices: [
        { size: 'A4', type: 'colour', side: 'single', price: 10, isActive: true },
        { size: 'A3', type: 'bw', side: 'single', price: 4, isActive: false },
        { size: 'A5', type: 'bw', side: 'single', price: 1 },
        { size: 'A4', type: 'bw', side: 'double', price: '3' },
      ],
    })
    expect(rows).toEqual([
      { size: 'A4', type: 'colour', side: 'single', price: 10 },
      { size: 'A4', type: 'bw', side: 'double', price: 3 },
    ])
    expect(parsePrices(undefined)).toEqual([])
  })

  it('labels and currency format', () => {
    expect(rateLabel(2, 'SINGLE')).toBe('₹2 / page')
    expect(rateLabel(18, 'DOUBLE')).toBe('₹18 / sheet')
    expect(rupees(42)).toBe('₹42')
  })
})

describe('validators', () => {
  it('amrita email accepts subdomains only of amrita.edu', () => {
    expect(isAmritaEmail('a@amrita.edu')).toBe(true)
    expect(isAmritaEmail('a@cb.students.amrita.edu')).toBe(true)
    expect(isAmritaEmail('a@gmail.com')).toBe(false)
    expect(isAmritaEmail('a@notamrita.edu')).toBe(false)
    expect(isAmritaEmail('bad-email')).toBe(false)
  })

  it('password + phone rules with exact message', () => {
    expect(passwordIssue('abc')).toBe('Password must be at least 4 characters')
    expect(passwordIssue('abcd')).toBeNull()
    expect(isValidPhone('98765 43210')).toBe(true)
    expect(isValidPhone('+91 98765 43210')).toBe(true)
    expect(isValidPhone('12345')).toBe(false)
  })
})

describe('initials', () => {
  it('mirrors AppUser.initials', () => {
    expect(initials('')).toBe('?')
    expect(initials('ananya')).toBe('A')
    expect(initials('Ananya Menon')).toBe('AM')
    expect(initials('A B C')).toBe('AC')
  })
})

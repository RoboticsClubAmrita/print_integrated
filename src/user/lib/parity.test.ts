/**
 * Parity tests locking the 1:1 ports to the Flutter app's behavior,
 * including exact user-facing error strings.
 */
import { describe, expect, it } from 'vitest'
import { formatPageRange, parsePageRange } from '@/lib/pageRange'
import { printCost, rateLabel, rupees, sheetsPerCopy } from '@/lib/pricing'
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

describe('pricing', () => {
  it('matches the app formula (₹2/page single, ₹3/sheet double)', () => {
    expect(printCost({ pages: 8, copies: 2, side: 'SINGLE' })).toBe(32)
    expect(printCost({ pages: 5, copies: 1, side: 'DOUBLE' })).toBe(9) // ceil(5/2)=3 sheets
    expect(printCost({ pages: 0, copies: 3, side: 'SINGLE' })).toBe(0)
    expect(printCost({ pages: 3, copies: 0, side: 'DOUBLE' })).toBe(0)
    expect(sheetsPerCopy(5, 'DOUBLE')).toBe(3)
    expect(sheetsPerCopy(5, 'SINGLE')).toBe(5)
  })

  it('labels and currency format', () => {
    expect(rateLabel('SINGLE')).toBe('₹2 / page')
    expect(rateLabel('DOUBLE')).toBe('₹3 / sheet')
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

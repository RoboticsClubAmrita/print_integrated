/**
 * Verbatim port of the Flutter app's page-range parser
 * (lib/utils/page_range.dart) — including exact error messages.
 */

/** Mirrors Dart's `int.tryParse`: the whole string must be an integer. */
function tryParseInt(value: string): number | null {
  if (!/^[+-]?\d+$/.test(value)) return null
  return Number.parseInt(value, 10)
}

/**
 * Parses a printer-style page range string (e.g. "1-5, 8, 11-13") into a
 * sorted, de-duplicated list of 1-based page numbers, validated against
 * `totalPages`. An empty/blank input (or "all") means "all pages".
 *
 * Throws an `Error` with a user-facing message if the input is malformed
 * or references a page outside the document.
 */
export function parsePageRange(input: string, totalPages: number): number[] {
  const trimmed = input.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>()
  for (const rawPart of trimmed.split(',')) {
    const part = rawPart.trim()
    if (part === '') continue

    if (part.includes('-')) {
      const bounds = part.split('-')
      if (bounds.length !== 2) {
        throw new Error(`Invalid range "${part}"`)
      }
      const start = tryParseInt(bounds[0].trim())
      const end = tryParseInt(bounds[1].trim())
      if (start === null || end === null || start < 1 || end < start) {
        throw new Error(`Invalid range "${part}"`)
      }
      if (end > totalPages) {
        throw new Error(`Page ${end} is beyond the document's ${totalPages} pages`)
      }
      for (let p = start; p <= end; p++) pages.add(p)
    } else {
      const page = tryParseInt(part)
      if (page === null || page < 1) {
        throw new Error(`Invalid page "${part}"`)
      }
      if (page > totalPages) {
        throw new Error(`Page ${page} is beyond the document's ${totalPages} pages`)
      }
      pages.add(page)
    }
  }

  if (pages.size === 0) {
    throw new Error('Enter at least one page')
  }

  return [...pages].sort((a, b) => a - b)
}

/**
 * Formats a sorted page list back into a compact range string,
 * e.g. [1,2,3,5,8,9] -> "1-3, 5, 8-9".
 */
export function formatPageRange(pages: number[]): string {
  if (pages.length === 0) return ''
  const parts: string[] = []
  let start = pages[0]
  let prev = pages[0]
  for (const p of pages.slice(1)) {
    if (p === prev + 1) {
      prev = p
      continue
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = p
    prev = p
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`)
  return parts.join(', ')
}

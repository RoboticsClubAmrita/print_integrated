/**
 * Turns a Word document into printable PDF pages, in the browser.
 *
 * A .docx is a zip of OOXML; `word/document.xml` holds the body. This reads
 * that directly — paragraphs, headings, bold/italic runs, lists, tables and
 * explicit page breaks — and lays it out on A4 here.
 *
 * It is a re-layout, not a rendering of Word's own pagination. Word decides
 * where pages break using the installed fonts, the printer driver and layout
 * rules this cannot see, so its page count is not knowable from the file. The
 * document produced here *is* the document: it gets previewed, counted, priced
 * and printed, so those four can never disagree — which is the whole point.
 *
 * What is deliberately not reproduced: exact fonts and sizes, colours, images,
 * headers/footers, columns, text boxes, and Word's own page breaks.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { unzipSync, strFromU8 } from 'fflate'

const PAGE_WIDTH = 595.28 // A4 portrait, points
const PAGE_HEIGHT = 841.89
const MARGIN = 56
const BODY_SIZE = 11
const LINE_GAP = 1.45
const PARA_GAP = 6
const INDENT = 18

const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

/** Raised when a Word document cannot be read or has nothing to print. */
export class WordDocumentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WordDocumentError'
  }
}

interface Run {
  text: string
  bold: boolean
  italic: boolean
}

interface Block {
  kind: 'paragraph' | 'heading' | 'bullet' | 'table-row'
  runs: Run[]
  /** Heading depth 1-3, only meaningful for `heading`. */
  level: number
  /** Cell texts, only meaningful for `table-row`. */
  cells: string[]
  /** A hard page break was requested before this block. */
  breakBefore: boolean
}

/**
 * pdf-lib's standard fonts are WinAnsi-encoded and throw on anything outside
 * that range. One pasted emoji or CJK character would otherwise fail the whole
 * order, so unrepresentable characters become '?'.
 */
function toWinAnsi(value: string): string {
  let out = ''
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code === 9) out += '    '
    else if (code >= 32 && code <= 126) out += char
    else if (code >= 160 && code <= 255) out += char
    else if (code === 0x2018 || code === 0x2019) out += "'"
    else if (code === 0x201c || code === 0x201d) out += '"'
    else if (code === 0x2013 || code === 0x2014) out += '-'
    else if (code === 0x2026) out += '...'
    else if (code < 32) out += ''
    else out += '?'
  }
  return out
}

const localName = (node: Element): string => node.localName ?? node.nodeName.replace(/^.*:/, '')

/**
 * Element children via `childNodes` rather than `children`: the latter is not
 * present on every XML DOM implementation, and this keeps the parser usable
 * outside a browser (it is what the tests drive).
 */
function elementChildren(node: Element): Element[] {
  const out: Element[] = []
  const nodes = node.childNodes
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i]
    if (child.nodeType === 1) out.push(child as Element)
  }
  return out
}

function childrenNamed(node: Element, name: string): Element[] {
  return elementChildren(node).filter((child) => localName(child) === name)
}

function firstNamed(node: Element, name: string): Element | null {
  return childrenNamed(node, name)[0] ?? null
}

/** OOXML marks a property on by presence; `w:val="0"`/`"false"` turns it off. */
function isOn(parent: Element | null, name: string): boolean {
  if (!parent) return false
  const el = firstNamed(parent, name)
  if (!el) return false
  const val = el.getAttribute('w:val')
  return val !== '0' && val !== 'false'
}

function readRuns(paragraph: Element): { runs: Run[]; breakBefore: boolean } {
  const runs: Run[] = []
  let breakBefore = false

  for (const run of childrenNamed(paragraph, 'r')) {
    const props = firstNamed(run, 'rPr')
    const bold = isOn(props, 'b')
    const italic = isOn(props, 'i')

    for (const child of elementChildren(run)) {
      const name = localName(child)
      if (name === 't') {
        runs.push({ text: toWinAnsi(child.textContent ?? ''), bold, italic })
      } else if (name === 'tab') {
        runs.push({ text: '    ', bold, italic })
      } else if (name === 'br') {
        // A page break belongs to the paragraph; a plain break is whitespace.
        if (child.getAttribute('w:type') === 'page') breakBefore = true
        else runs.push({ text: ' ', bold, italic })
      }
    }
  }

  return { runs, breakBefore }
}

function readParagraph(paragraph: Element): Block | null {
  const props = firstNamed(paragraph, 'pPr')
  const styleEl = props ? firstNamed(props, 'pStyle') : null
  const style = (styleEl?.getAttribute('w:val') ?? '').toLowerCase()
  const numbered = props ? !!firstNamed(props, 'numPr') : false

  const { runs, breakBefore } = readRuns(paragraph)
  const text = runs.map((r) => r.text).join('').trim()
  // Empty paragraphs still carry a page break, and are otherwise spacing.
  if (!text && !breakBefore) return null

  let kind: Block['kind'] = 'paragraph'
  let level = 0
  if (style === 'title') {
    kind = 'heading'
    level = 1
  } else if (/^heading(\d)$/.test(style)) {
    kind = 'heading'
    level = Math.min(3, Number(/^heading(\d)$/.exec(style)![1]))
  } else if (numbered || style.includes('listparagraph')) {
    kind = 'bullet'
  }

  return { kind, runs, level, cells: [], breakBefore }
}

function readTable(table: Element): Block[] {
  const rows: Block[] = []
  for (const row of childrenNamed(table, 'tr')) {
    const cells = childrenNamed(row, 'tc').map((cell) =>
      childrenNamed(cell, 'p')
        .map((p) => readRuns(p).runs.map((r) => r.text).join(''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    if (cells.some((c) => c)) {
      rows.push({ kind: 'table-row', runs: [], level: 0, cells, breakBefore: false })
    }
  }
  return rows
}

function readBlocks(bytes: ArrayBuffer, fileName: string): Block[] {
  const magic = new Uint8Array(bytes.slice(0, 4))
  const isZip = magic[0] === 0x50 && magic[1] === 0x4b && magic[2] === 0x03 && magic[3] === 0x04
  if (!isZip) {
    throw new WordDocumentError(
      `${fileName} is not a readable .docx document. If it was saved in the older .doc ` +
        `format, open it and use "Save As" to write a .docx — or export it as a PDF.`,
    )
  }

  let xml: string
  try {
    const zip = unzipSync(new Uint8Array(bytes), { filter: (f) => f.name === 'word/document.xml' })
    const entry = zip['word/document.xml']
    if (!entry) {
      throw new WordDocumentError(
        `${fileName} does not contain a Word document body. If it is password-protected, ` +
          `remove the password and try again.`,
      )
    }
    xml = strFromU8(entry)
  } catch (error) {
    if (error instanceof WordDocumentError) throw error
    throw new WordDocumentError(
      `${fileName} could not be read. If it is password-protected, remove the password and try again.`,
    )
  }

  const parsed = new DOMParser().parseFromString(xml, 'application/xml')
  if (parsed.getElementsByTagName('parsererror').length) {
    throw new WordDocumentError(`${fileName} could not be read — its contents are damaged.`)
  }

  const body = parsed.getElementsByTagName('w:body')[0] ?? parsed.documentElement
  const blocks: Block[] = []
  for (const child of elementChildren(body)) {
    const name = localName(child)
    if (name === 'p') {
      const block = readParagraph(child)
      if (block) blocks.push(block)
    } else if (name === 'tbl') {
      blocks.push(...readTable(child))
    }
  }

  if (!blocks.length) {
    throw new WordDocumentError(`${fileName} has no text in it — there would be nothing to print.`)
  }
  return blocks
}

interface Fonts {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
  boldItalic: PDFFont
}

const fontFor = (fonts: Fonts, run: Run): PDFFont =>
  run.bold && run.italic
    ? fonts.boldItalic
    : run.bold
      ? fonts.bold
      : run.italic
        ? fonts.italic
        : fonts.regular

/** Greedy word wrap across styled runs, producing lines of positioned pieces. */
function wrapRuns(runs: Run[], fonts: Fonts, size: number, width: number): Run[][] {
  const lines: Run[][] = []
  let line: Run[] = []
  let used = 0

  for (const run of runs) {
    const font = fontFor(fonts, run)
    // Keep the spaces: splitting on them and rejoining loses runs of them.
    for (const word of run.text.split(/(\s+)/)) {
      if (!word) continue
      const wordWidth = font.widthOfTextAtSize(word, size)

      if (used + wordWidth > width && used > 0) {
        lines.push(line)
        line = []
        used = 0
        if (/^\s+$/.test(word)) continue // a wrap eats the space it broke on
      }

      // A single word longer than the line gets hard-split rather than
      // running off the page.
      if (wordWidth > width) {
        let chunk = ''
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, size) > width && chunk) {
            line.push({ ...run, text: chunk })
            lines.push(line)
            line = []
            chunk = char
          } else {
            chunk += char
          }
        }
        if (chunk) {
          line.push({ ...run, text: chunk })
          used = font.widthOfTextAtSize(chunk, size)
        }
        continue
      }

      line.push({ ...run, text: word })
      used += wordWidth
    }
  }

  if (line.length) lines.push(line)
  return lines.length ? lines : [[]]
}

/**
 * Appends a Word document to `pdf`, laying its text out on A4 pages.
 */
export async function appendWordDocumentToPdf(
  pdf: PDFDocument,
  bytes: ArrayBuffer,
  fileName: string,
): Promise<void> {
  const blocks = readBlocks(bytes, fileName)
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdf.embedFont(StandardFonts.HelveticaBoldOblique),
  }
  const ink = rgb(0.05, 0.05, 0.05)
  const rule = rgb(0.82, 0.82, 0.82)

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let cursorY = PAGE_HEIGHT - MARGIN

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    cursorY = PAGE_HEIGHT - MARGIN
  }

  const ensure = (needed: number) => {
    if (cursorY - needed < MARGIN) newPage()
  }

  for (const block of blocks) {
    if (block.breakBefore) newPage()

    if (block.kind === 'table-row') {
      const columns = Math.max(1, block.cells.length)
      const cellWidth = CONTENT_WIDTH / columns
      const wrapped = block.cells.map((cell) =>
        wrapRuns([{ text: cell, bold: false, italic: false }], fonts, 9, cellWidth - 8),
      )
      const height = Math.max(...wrapped.map((lines) => lines.length)) * 9 * LINE_GAP + 4
      ensure(height)

      wrapped.forEach((lines, col) => {
        let y = cursorY - 9
        for (const line of lines) {
          page.drawText(line.map((r) => r.text).join(''), {
            x: MARGIN + col * cellWidth + 4,
            y,
            size: 9,
            font: fonts.regular,
            color: ink,
          })
          y -= 9 * LINE_GAP
        }
      })

      cursorY -= height
      page.drawLine({
        start: { x: MARGIN, y: cursorY + 2 },
        end: { x: PAGE_WIDTH - MARGIN, y: cursorY + 2 },
        thickness: 0.4,
        color: rule,
      })
      continue
    }

    const size = block.kind === 'heading' ? [0, 17, 14, 12][block.level] || 12 : BODY_SIZE
    const indent = block.kind === 'bullet' ? INDENT : 0
    const runs =
      block.kind === 'heading'
        ? block.runs.map((r) => ({ ...r, bold: true }))
        : block.runs

    if (!runs.length) continue
    if (block.kind === 'heading') ensure(size * LINE_GAP * 2)

    const lines = wrapRuns(runs, fonts, size, CONTENT_WIDTH - indent)
    lines.forEach((line, index) => {
      ensure(size * LINE_GAP)
      let x = MARGIN + indent

      if (block.kind === 'bullet' && index === 0) {
        page.drawText('•', {
          x: MARGIN + 4,
          y: cursorY - size,
          size,
          font: fonts.regular,
          color: ink,
        })
      }

      for (const piece of line) {
        const font = fontFor(fonts, piece)
        page.drawText(piece.text, { x, y: cursorY - size, size, font, color: ink })
        x += font.widthOfTextAtSize(piece.text, size)
      }
      cursorY -= size * LINE_GAP
    })

    cursorY -= block.kind === 'heading' ? PARA_GAP + 2 : PARA_GAP
  }
}

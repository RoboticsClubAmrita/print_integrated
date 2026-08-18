/**
 * Everything that happens to a document before the backend ever sees it.
 *
 * The browser is the only place the document exists until the order is paid
 * for, so this module owns three jobs the server used to do:
 *
 *   1. Conversion — whatever the user picked becomes one PDF here. The server
 *      stores nothing else, and the PDF built here is exactly what gets
 *      previewed, priced and printed.
 *   2. Page detection — counted off the real rendered PDF via pdf.js. If it
 *      cannot be counted the upload fails and says so; it never falls back to
 *      a guess, because the guess is what gets billed.
 *   3. Hashing — a sha256 quoted to the backend at registration and checked
 *      again when the bytes are finally uploaded, so the document that gets
 *      printed is provably the one that was priced.
 *
 * The PDF is held in IndexedDB (not just memory) between placing the order and
 * paying for it, so a reload or a dropped connection doesn't lose a document
 * the user has already been charged for.
 */
import { PDFDocument } from 'pdf-lib'
import { appendWordDocumentToPdf, WordDocumentError } from '@/services/wordDocument'
import { fileExt } from '@/lib/format'
import { uid } from '@/services/db'
import { countPdfPages } from '@/services/pdf'

/**
 * What the picker offers.
 *
 * Word documents are re-laid-out here (see `wordDocument.ts`) rather than
 * reproducing Word's own pagination, which depends on fonts and layout rules
 * the file doesn't carry. The PDF built here is what gets previewed, counted,
 * priced and printed, so those can't disagree — but it will not look
 * identical to the same file opened in Word. Exporting to PDF from Word first
 * takes one click and is exact.
 */
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'jpg', 'jpeg', 'png'] as const
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',')

/**
 * What to show the user as the accepted formats. Derived from the list above
 * rather than written out, so the text on screen can never drift from the
 * list actually enforced by `isAccepted` and the file input.
 */
export const ACCEPTED_LABEL = ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(' · ')

/** Formats we recognise but cannot convert in the browser, with what to do instead. */
const CONVERT_YOURSELF: Record<string, string> = {
  // .doc is the pre-2007 binary format; .docx is handled directly.
  doc: 'legacy Word',
  ppt: 'PowerPoint',
  pptx: 'PowerPoint',
  xls: 'Excel',
  xlsx: 'Excel',
  txt: 'text',
  rtf: 'rich text',
  odt: 'OpenDocument',
}

export type FileKind = 'pdf' | 'image'

export interface StoredFile {
  fileId: string
  /** Always a PDF — converted here if the user picked anything else. */
  file: File
  objectUrl: string
  kind: FileKind
  ext: string
  sizeKb: number
  /** Lowercase hex sha256 of `file`, quoted to the backend at registration. */
  checksum: string
}

/** Raised when a document cannot be turned into a printable PDF. */
export class DocumentPrepError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentPrepError'
  }
}

/** Raised when a PDF's page count cannot be determined. Never swallowed. */
export class PageDetectionError extends Error {
  constructor(message = 'page detection failed') {
    super(message)
    this.name = 'PageDetectionError'
  }
}

const registry = new Map<string, StoredFile>()

export function isAccepted(fileName: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(fileExt(fileName))
}

export function kindOf(fileName: string): FileKind {
  return fileExt(fileName) === 'pdf' ? 'pdf' : 'image'
}

/** True for formats this device turns into PDF pages itself. */
export function isWordDocument(fileName: string): boolean {
  return fileExt(fileName) === 'docx'
}

/** Lowercase hex sha256, computed in the browser with WebCrypto. */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Merges everything the user picked into a single PDF.
 *
 * PDFs are copied page-for-page and images are placed one per page at their
 * natural size. An unsupported format stops the whole thing with an
 * actionable message rather than being silently dropped from the merge.
 */
export async function mergeFilesIntoPdf(files: File[]): Promise<File> {
  if (files.length === 0) {
    throw new DocumentPrepError('No files were selected.')
  }

  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const extension = fileExt(file.name)
    const fileBytes = await file.arrayBuffer()

    if (extension === 'pdf') {
      let sourcePdf: PDFDocument
      try {
        sourcePdf = await PDFDocument.load(fileBytes)
      } catch {
        throw new DocumentPrepError(
          `${file.name} could not be read. If it is password-protected, remove the password and try again.`,
        )
      }
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
      continue
    }

    if (extension === 'docx') {
      try {
        await appendWordDocumentToPdf(mergedPdf, fileBytes, file.name)
      } catch (error) {
        throw new DocumentPrepError(
          error instanceof WordDocumentError
            ? error.message
            : `${file.name} could not be converted to a printable PDF.`,
        )
      }
      continue
    }

    if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
      const image =
        extension === 'png'
          ? await mergedPdf.embedPng(fileBytes)
          : await mergedPdf.embedJpg(fileBytes)

      const { width, height } = image.scale(1)
      const page = mergedPdf.addPage([width, height])
      page.drawImage(image, { x: 0, y: 0, width, height })
      continue
    }

    const label = CONVERT_YOURSELF[extension]
    throw new DocumentPrepError(
      label
        ? `${file.name} is a ${label} document. Save it as a PDF first — that way the preview, the page count and the printout all match exactly.`
        : `${file.name} is not a supported file type. Upload one of: ${ACCEPTED_LABEL}.`,
    )
  }

  const mergedBytes = await mergedPdf.save()
  const mergedBlob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })

  // One source file keeps its own name (minus the extension) so the order is
  // recognisable; a multi-file merge gets a neutral one.
  const baseName =
    files.length === 1 ? files[0].name.replace(/\.[^.]+$/, '') : 'combined-documents'

  return new File([mergedBlob], `${baseName}.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  })
}

/**
 * Turns the user's selection into the single PDF the rest of the flow works
 * with: converted, hashed, and registered in memory for preview.
 */
export async function prepareDocument(files: File[]): Promise<StoredFile> {
  const pdf = await mergeFilesIntoPdf(files)
  const bytes = await pdf.arrayBuffer()
  const checksum = await sha256Hex(bytes)

  const stored: StoredFile = {
    fileId: uid('file'),
    file: pdf,
    objectUrl: URL.createObjectURL(pdf),
    kind: 'pdf',
    ext: 'pdf',
    sizeKb: Math.ceil(pdf.size / 1024),
    checksum,
  }

  registry.set(stored.fileId, stored)
  return stored
}

export function getFile(fileId: string): StoredFile | undefined {
  return registry.get(fileId)
}

export function revokeFile(fileId: string): void {
  const stored = registry.get(fileId)
  if (stored) {
    URL.revokeObjectURL(stored.objectUrl)
    registry.delete(stored.fileId)
  }
}

/**
 * Exact page count, read off the prepared PDF.
 *
 * Throws rather than returning a fallback: this number is what the user is
 * charged for and what the backend re-checks against the uploaded document,
 * so a wrong-but-plausible answer is worse than an honest failure.
 */
export async function detectPages(stored: StoredFile): Promise<number> {
  let pages: number
  try {
    const buffer = await stored.file.arrayBuffer()
    pages = await countPdfPages(buffer)
  } catch (error) {
    throw new PageDetectionError(
      error instanceof Error && error.message
        ? `page detection failed (${error.message})`
        : 'page detection failed',
    )
  }

  if (!Number.isInteger(pages) || pages < 1) {
    throw new PageDetectionError('page detection failed — the document reported no pages')
  }

  return pages
}

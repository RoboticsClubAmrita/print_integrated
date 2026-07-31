/**
 * In-memory file registry. Blobs and object URLs never touch localStorage —
 * orders persist metadata only (matching the Flutter app, where previews
 * exist only before the order is placed).
 */
import { PDFDocument } from 'pdf-lib'
import { clamp, fileExt } from '@/lib/format'
import { uid } from '@/services/db'
import { countPdfPages } from '@/services/pdf'

export const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'] as const
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',')

export type FileKind = 'pdf' | 'image' | 'doc'

export interface StoredFile {
  fileId: string
  file: File
  objectUrl: string
  kind: FileKind
  ext: string
  sizeKb: number
}

const registry = new Map<string, StoredFile>()

export function isAccepted(fileName: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(fileExt(fileName))
}

export function kindOf(fileName: string): FileKind {
  const ext = fileExt(fileName)

  if (ext === 'pdf') return 'pdf'

  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    return 'image'
  }

  return 'doc'
}

export function putFile(file: File): StoredFile {
  const stored: StoredFile = {
    fileId: uid('file'),
    file,
    objectUrl: URL.createObjectURL(file),
    kind: kindOf(file.name),
    ext: fileExt(file.name),
    sizeKb: Math.ceil(file.size / 1024),
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
 * Detects the page count:
 * - real count for PDFs using pdf.js;
 * - one page for images;
 * - estimated count for DOC and DOCX.
 */
export async function detectPages(stored: StoredFile): Promise<number> {
  if (stored.kind === 'pdf') {
    const buffer = await stored.file.arrayBuffer()
    return countPdfPages(buffer)
  }

  if (stored.kind === 'image') {
    return 1
  }

  return clamp(Math.round(stored.sizeKb / 35), 2, 24)
}

/**
 * Merges PDF and image files into one PDF.
 *
 * DOC and DOCX files require backend conversion before they can
 * be included in the final merged PDF.
 */
export async function mergeFilesIntoPdf(files: File[]): Promise<File> {
  if (files.length === 0) {
    throw new Error('No files were selected.')
  }

  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const extension = fileExt(file.name)
    const fileBytes = await file.arrayBuffer()

    if (extension === 'pdf') {
      const sourcePdf = await PDFDocument.load(fileBytes)

      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices(),
      )

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })

      continue
    }

    if (
      extension === 'jpg' ||
      extension === 'jpeg' ||
      extension === 'png'
    ) {
      const image =
        extension === 'png'
          ? await mergedPdf.embedPng(fileBytes)
          : await mergedPdf.embedJpg(fileBytes)

      const { width, height } = image.scale(1)
      const page = mergedPdf.addPage([width, height])

      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      })

      continue
    }

    if (extension === 'doc' || extension === 'docx') {
      throw new Error(
        `${file.name} must be converted to PDF by the backend before merging.`,
      )
    }

    throw new Error(`${file.name} is not a supported file type.`)
  }

  const mergedBytes = await mergedPdf.save()
  const pdfBytes = new Uint8Array(mergedBytes)

  const mergedBlob = new Blob([pdfBytes], {
    type: 'application/pdf',
  })

  return new File([mergedBlob], 'combined-documents.pdf', {
    type: 'application/pdf',
    lastModified: Date.now(),
  })
}
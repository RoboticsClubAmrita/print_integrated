/**
 * In-memory file registry. Blobs and object URLs never touch localStorage —
 * orders persist metadata only (matching the Flutter app, where previews
 * exist only before the order is placed).
 */
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
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'image'
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
 * Detects the page count: real count for PDFs (via pdf.js), 1 for images,
 * and a deterministic mock for doc/docx (the real backend counts these
 * server-side, which a static site cannot).
 */
export async function detectPages(stored: StoredFile): Promise<number> {
  if (stored.kind === 'pdf') {
    const buffer = await stored.file.arrayBuffer()
    return countPdfPages(buffer)
  }
  if (stored.kind === 'image') return 1
  return clamp(Math.round(stored.sizeKb / 35), 2, 24)
}

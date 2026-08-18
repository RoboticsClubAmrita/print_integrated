/**
 * Resolving the PDF behind an order, whichever side of payment it is on.
 *
 * Two sources, in priority order:
 *   1. the copy still held on this device (order placed, not yet delivered) —
 *      instant, and the only source that exists in that window;
 *   2. the backend, once the document has been uploaded.
 *
 * The backend copy needs an Authorization header, so it can't be handed to an
 * <iframe src> directly; it is fetched as a blob and shown from an object URL.
 */
import type { Order } from '@/types'
import { fileService } from '../../services/api'
import { getPending } from '@/services/pendingUploads'
import { apiErrorMessage } from '@/lib/apiError'

export type PreviewSource = 'local' | 'server'

export interface DocumentPreview {
  blob: Blob
  objectUrl: string
  source: PreviewSource
  /** Call when the preview closes — object URLs leak until revoked. */
  release: () => void
}

export class DocumentUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentUnavailableError'
  }
}

function wrap(blob: Blob, source: PreviewSource): DocumentPreview {
  const objectUrl = URL.createObjectURL(blob)
  return {
    blob,
    objectUrl,
    source,
    release: () => URL.revokeObjectURL(objectUrl),
  }
}

/**
 * Opens the document for an order.
 *
 * @throws DocumentUnavailableError when there is nothing to show — the
 *   retention window has closed, or the order was placed on another device
 *   and never paid for, so its document was never uploaded.
 */
export async function openOrderDocument(order: Order): Promise<DocumentPreview> {
  if (!order.fileId) {
    throw new DocumentUnavailableError('This order has no document attached.')
  }

  // 1. Still on this device — no round trip needed.
  const held = await getPending(order.fileId).catch(() => undefined)
  if (held?.blob) return wrap(held.blob, 'local')

  // 2. Uploaded — read it back from the server.
  if (!order.fileUrl) {
    throw new DocumentUnavailableError(
      'This document has not been sent to the print server yet. It will be available once the payment is confirmed.',
    )
  }

  try {
    const blob = await fileService.fetchContent(order.fileId)
    return wrap(blob, 'server')
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 410) {
      throw new DocumentUnavailableError(
        'This document is no longer available — documents are kept for 24 hours after collection.',
      )
    }
    if (status === 403) {
      throw new DocumentUnavailableError('This document belongs to another account.')
    }
    throw new DocumentUnavailableError(apiErrorMessage(err, 'The document could not be opened.'))
  }
}

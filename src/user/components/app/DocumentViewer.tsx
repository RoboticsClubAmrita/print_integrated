import { useEffect, useRef, useState } from 'react'
import { FileWarning, Loader2 } from 'lucide-react'
import type { Order } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { openPdf, type PdfHandle } from '@/services/pdf'
import { DocumentUnavailableError, openOrderDocument, type PreviewSource } from '@/services/documentPreview'

/** Rendered width of each page canvas, in CSS pixels. */
const PAGE_WIDTH = 560

/**
 * Reads back the document attached to an order.
 *
 * Before payment clears the PDF is still on this device and is shown from
 * there; afterwards it comes from the print server, which only serves it to
 * the account that owns it and only until 24 hours after collection. Both
 * cases render identically — the user just sees their document.
 */
export function DocumentViewer({
  order,
  open,
  onClose,
}: {
  order: Order
  open: boolean
  onClose: () => void
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<PreviewSource | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<PdfHandle | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    let release: (() => void) | null = null

    setStatus('loading')
    setError(null)
    setSource(null)
    setPageCount(0)

    void (async () => {
      try {
        const preview = await openOrderDocument(order)
        release = preview.release
        if (cancelled) {
          preview.release()
          return
        }

        const handle = await openPdf(await preview.blob.arrayBuffer())
        if (cancelled) {
          handle.destroy()
          return
        }

        handleRef.current = handle
        setSource(preview.source)
        setPageCount(handle.numPages)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof DocumentUnavailableError
            ? err.message
            : 'This document could not be opened.',
        )
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      release?.()
      handleRef.current?.destroy()
      handleRef.current = null
    }
  }, [open, order])

  // Rasterise the pages once the document is ready and the canvases exist.
  useEffect(() => {
    if (status !== 'ready' || !handleRef.current || !containerRef.current) return

    const handle = handleRef.current
    const canvases = containerRef.current.querySelectorAll('canvas')
    let cancelled = false

    void (async () => {
      for (let i = 0; i < canvases.length; i++) {
        if (cancelled) return
        try {
          await handle.renderPage(i + 1, canvases[i], PAGE_WIDTH)
        } catch {
          // A page that won't rasterise leaves its placeholder in place rather
          // than tearing down the whole preview.
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status, pageCount])

  return (
    <Modal open={open} onClose={onClose} title={order.fileName} size="lg" showClose>
      <div className="min-h-[240px]">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
            <Loader2 size={22} className="animate-spin" aria-hidden />
            <p className="text-[13.5px] font-semibold">Opening your document…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
            <FileWarning size={26} strokeWidth={1.8} className="text-muted" aria-hidden />
            <p className="text-[13.5px] font-semibold text-ink">{error}</p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <p className="mb-4 text-[11.5px] font-semibold text-muted">
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
              {source === 'local'
                ? ' • held on this device until the payment is confirmed'
                : ' • kept for 24 hours after collection'}
            </p>
            <div
              ref={containerRef}
              className="flex max-h-[65vh] flex-col items-center gap-4 overflow-y-auto rounded-[14px] bg-chip p-4"
            >
              {Array.from({ length: pageCount }, (_, i) => (
                <canvas
                  key={i}
                  aria-label={`Page ${i + 1} of ${pageCount}`}
                  className="w-full max-w-full rounded-[8px] bg-white shadow-sm"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

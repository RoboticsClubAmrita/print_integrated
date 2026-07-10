import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FileWarning, X } from 'lucide-react'
import type { StoredFile } from '@/services/fileService'
import type { PrintLocation, PrintSide } from '@/types'
import { openPdf, type PdfHandle } from '@/services/pdf'
import { formatPageRange } from '@/lib/pageRange'
import { rateLabel, rupees, sheetsPerCopy } from '@/lib/pricing'
import { SIDE_LABELS } from '@/lib/orders'
import { formatDateTimeDot } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { sheetUp } from '@/lib/motion'

const THUMB_CAP = 12

function PdfThumbnails({ stored, pages }: { stored: StoredFile; pages: number[] }) {
  const [handle, setHandle] = useState<PdfHandle | null>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const shown = pages.slice(0, THUMB_CAP)

  useEffect(() => {
    let cancelled = false
    let active: PdfHandle | null = null
    stored.file.arrayBuffer().then(async (buf) => {
      const h = await openPdf(buf)
      if (cancelled) {
        h.destroy()
        return
      }
      active = h
      setHandle(h)
    })
    return () => {
      cancelled = true
      active?.destroy()
    }
  }, [stored])

  useEffect(() => {
    if (!handle) return
    shown.forEach((pageNumber, i) => {
      const canvas = canvasRefs.current[i]
      if (canvas) void handle.renderPage(pageNumber, canvas, 480)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, pages.join(',')])

  if (!handle) {
    return (
      <div className="grid place-items-center h-[460px]">
        <Spinner size={26} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {shown.map((pageNumber, i) => (
        <canvas
          key={pageNumber}
          ref={(el) => {
            canvasRefs.current[i] = el
          }}
          className="max-w-full rounded-[8px] shadow-lift"
        />
      ))}
      {pages.length > THUMB_CAP && (
        <p className="text-[13px] font-semibold text-muted py-2">
          + {pages.length - THUMB_CAP} more page{pages.length - THUMB_CAP === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}

export interface PreviewConfig {
  stored: StoredFile
  totalPages: number
  selectedPages: number[] | null
  copies: number
  side: PrintSide
  scheduledFor: Date | null
  location: PrintLocation | null
  estimate: number
}

export function PrintPreview({
  open,
  config,
  onCancel,
  onConfirm,
  confirming,
}: {
  open: boolean
  config: PreviewConfig | null
  onCancel: () => void
  onConfirm: () => void
  confirming: boolean
}) {
  if (!config) return null
  const pages = config.selectedPages ?? Array.from({ length: config.totalPages }, (_, i) => i + 1)
  const sheets = sheetsPerCopy(pages.length, config.side) * config.copies

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          variants={sheetUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[65] bg-bg overflow-y-auto"
        >
          <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-line/70 flex items-center justify-center h-16 px-4">
            <button
              type="button"
              aria-label="Close preview"
              onClick={onCancel}
              className="press absolute left-4 grid place-items-center size-10 rounded-full bg-chip hover:bg-line/70 transition-colors"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
            <h1 className="text-[16px] font-extrabold tracking-[-0.2px]">Print Preview</h1>
          </div>

          <div className="mx-auto max-w-[1000px] px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="card overflow-hidden">
              {config.stored.kind === 'pdf' ? (
                <PdfThumbnails stored={config.stored} pages={pages} />
              ) : config.stored.kind === 'image' ? (
                <div className="grid place-items-center p-6 bg-chip/40">
                  <img
                    src={config.stored.objectUrl}
                    alt={config.stored.file.name}
                    className="max-h-[500px] max-w-full rounded-[12px] shadow-lift"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] px-8 text-center gap-3">
                  <FileWarning size={30} className="text-muted" strokeWidth={1.6} />
                  <p className="text-[13.5px] font-medium text-muted max-w-[360px]">
                    Live preview isn&apos;t available for .{config.stored.ext} files yet — double-check
                    the settings below before confirming.
                  </p>
                </div>
              )}
            </div>

            <div className="card p-6 h-fit lg:sticky lg:top-24">
              <p className="text-[15px] font-extrabold text-ink truncate mb-4">
                {config.stored.file.name}
              </p>
              <dl className="flex flex-col gap-2.5 text-[13.5px]">
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-muted">Pages to print</dt>
                  <dd className="font-bold text-ink text-right">
                    {config.selectedPages === null
                      ? `All ${config.totalPages} pages`
                      : `${formatPageRange(config.selectedPages)} (${config.selectedPages.length} pages)`}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-muted">Copies</dt>
                  <dd className="font-bold text-ink">{config.copies}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-muted">Side</dt>
                  <dd className="font-bold text-ink">{SIDE_LABELS[config.side]}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-muted">Total sheets</dt>
                  <dd className="font-bold text-ink">{sheets}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-muted">Location</dt>
                  <dd className="font-bold text-ink">{config.location?.name ?? 'Not selected'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-muted">Print time</dt>
                  <dd className="font-bold text-ink">
                    {config.scheduledFor ? formatDateTimeDot(config.scheduledFor.toISOString()) : 'Now'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t-2 border-dashed border-line flex items-center justify-between">
                <span className="text-[15px] font-extrabold text-ink">Estimated Total</span>
                <span className="text-[20px] font-extrabold tracking-[-0.4px] text-ink">
                  {rupees(config.estimate)}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] font-medium text-muted">{rateLabel(config.side)}</p>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" size="md" fullWidth onClick={onCancel} disabled={confirming}>
                  Cancel
                </Button>
                <Button
                  size="md"
                  className="flex-[2]"
                  fullWidth
                  loading={confirming}
                  onClick={onConfirm}
                >
                  Confirm &amp; Print
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

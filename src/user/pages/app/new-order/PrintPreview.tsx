import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, ChevronDown, ChevronUp, FileWarning } from 'lucide-react'
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

/**
 * Height of the page viewport. Each page fills exactly this, and the scroller
 * is the same height, so scroll-snap lands on one whole page at a time and
 * `scrollTop / clientHeight` gives the current index.
 */
const PAGE_BOX = 'h-[420px] sm:h-[560px]'

/**
 * Single-page PDF viewer: shows one page at a time and scrolls (or steps)
 * through the rest, rather than stacking every page into one tall column.
 * Only the visible page and its immediate neighbours are rasterised, so a long
 * document doesn't render every page up front.
 */
function PdfPager({ stored, pages }: { stored: StoredFile; pages: number[] }) {
  const [handle, setHandle] = useState<PdfHandle | null>(null)
  const [current, setCurrent] = useState(0)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const renderedRef = useRef<Set<number>>(new Set())

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

  // A new document or page selection invalidates everything already drawn.
  useEffect(() => {
    renderedRef.current = new Set()
    setCurrent(0)
    scrollerRef.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, pages.join(',')])

  useEffect(() => {
    if (!handle) return
    const first = Math.max(0, current - 1)
    const last = Math.min(pages.length - 1, current + 1)
    for (let i = first; i <= last; i++) {
      if (renderedRef.current.has(i)) continue
      const canvas = canvasRefs.current[i]
      if (!canvas) continue
      renderedRef.current.add(i)
      void handle.renderPage(pages[i], canvas, 720)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, current, pages.join(',')])

  const step = (delta: number) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const next = Math.min(Math.max(current + delta, 0), pages.length - 1)
    scroller.scrollTo({ top: next * scroller.clientHeight, behavior: 'smooth' })
  }

  if (!handle) {
    return (
      <div className={`grid place-items-center ${PAGE_BOX}`}>
        <Spinner size={26} />
      </div>
    )
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={(e) => {
          const el = e.currentTarget
          setCurrent(Math.round(el.scrollTop / el.clientHeight))
        }}
        className={`snap-y snap-mandatory overflow-y-auto ${PAGE_BOX}`}
      >
        {pages.map((pageNumber, i) => (
          <div key={pageNumber} className={`snap-start grid place-items-center p-4 ${PAGE_BOX}`}>
            <canvas
              ref={(el) => {
                canvasRefs.current[i] = el
              }}
              className="max-h-full max-w-full rounded-[8px] shadow-lift"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => step(-1)}
          disabled={current === 0}
          className="press grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-line/70 disabled:opacity-35"
        >
          <ChevronUp size={17} strokeWidth={2.2} />
        </button>
        <p className="text-[12.5px] font-bold text-muted" aria-live="polite">
          Page {current + 1} of {pages.length}
        </p>
        <button
          type="button"
          aria-label="Next page"
          onClick={() => step(1)}
          disabled={current >= pages.length - 1}
          className="press grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-line/70 disabled:opacity-35"
        >
          <ChevronDown size={17} strokeWidth={2.2} />
        </button>
      </div>
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

/**
 * Print preview + confirm step. Rendered inline by NewOrderPage in place of the
 * 01/02/03 console rather than as a full-screen takeover, so confirming a job
 * never leaves the New Order page. Column proportions mirror the console's so
 * the page doesn't reflow when the two swap.
 */
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
  // Swapping the console out mid-page can leave the viewport below the preview;
  // bring the top of it into view.
  useEffect(() => {
    if (open) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [open])

  if (!open || !config) return null
  const pages = config.selectedPages ?? Array.from({ length: config.totalPages }, (_, i) => i + 1)
  const sheets = sheetsPerCopy(pages.length, config.side) * config.copies

  return (
    <motion.div
      variants={sheetUp}
      initial="hidden"
      animate="visible"
      className="mt-8 overflow-hidden rounded-[20px] border border-line bg-white"
    >
      <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-7">
        <button
          type="button"
          aria-label="Back to print settings"
          onClick={onCancel}
          disabled={confirming}
          className="press grid size-9 shrink-0 place-items-center rounded-full bg-chip transition-colors hover:bg-line/70 disabled:opacity-40"
        >
          <ArrowLeft size={17} strokeWidth={2.2} />
        </button>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-[-0.2px]">Print Preview</h2>
          <p className="truncate text-[12px] font-medium text-muted">{config.stored.file.name}</p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1.12fr_0.88fr] lg:divide-x lg:divide-line">
        <div className="p-5 sm:p-7">
          <div className="overflow-hidden rounded-[16px] bg-chip/40">
            {config.stored.kind === 'pdf' ? (
              <PdfPager stored={config.stored} pages={pages} />
            ) : config.stored.kind === 'image' ? (
              <div className="grid place-items-center p-6">
                <img
                  src={config.stored.objectUrl}
                  alt={config.stored.file.name}
                  className="max-h-[500px] max-w-full rounded-[12px] shadow-lift"
                />
              </div>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center gap-3 px-8 text-center">
                <FileWarning size={30} className="text-muted" strokeWidth={1.6} />
                <p className="max-w-[360px] text-[13.5px] font-medium text-muted">
                  Live preview isn&apos;t available for .{config.stored.ext} files yet — double-check
                  the settings below before confirming.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-line p-5 sm:p-7 lg:border-t-0">
          <div className="lg:sticky lg:top-[88px]">
            <dl className="flex flex-col gap-3 text-[13.5px]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-medium text-muted">Pages to print</dt>
                <dd className="text-right font-bold text-ink">
                  {config.selectedPages === null
                    ? `All ${config.totalPages} pages`
                    : `${formatPageRange(config.selectedPages)} (${config.selectedPages.length} pages)`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-medium text-muted">Copies</dt>
                <dd className="font-bold text-ink">{config.copies}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-medium text-muted">Side</dt>
                <dd className="font-bold text-ink">{SIDE_LABELS[config.side]}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-medium text-muted">Total sheets</dt>
                <dd className="font-bold text-ink">{sheets}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-medium text-muted">Location</dt>
                <dd className="text-right font-bold text-ink">
                  {config.location?.name ?? 'Not selected'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-medium text-muted">Print time</dt>
                <dd className="text-right font-bold text-ink">
                  {config.scheduledFor
                    ? formatDateTimeDot(config.scheduledFor.toISOString())
                    : 'Now'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t-2 border-dashed border-line pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[15px] font-extrabold text-ink">Estimated Total</span>
                <span className="text-[22px] font-extrabold tracking-[-0.4px] text-ink">
                  {rupees(config.estimate)}
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] font-medium text-muted">
                {rateLabel(config.side)}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1 whitespace-nowrap"
                onClick={onCancel}
                disabled={confirming}
              >
                Cancel
              </Button>
              <Button
                size="md"
                className="flex-[1.6] whitespace-nowrap"
                loading={confirming}
                onClick={onConfirm}
              >
                Confirm &amp; Print
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

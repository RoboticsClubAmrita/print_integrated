import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
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

/** Height of the scroll viewport. Pages are fit to width, so an A4 page is
 * taller than this — one page fills the view and you scroll through it and on
 * into the next, the way a normal PDF viewer behaves. */
const VIEWER_BOX = 'h-[440px] sm:h-[620px]'

/** Horizontal breathing room around a page, in px. */
const PAGE_INSET = 16

/**
 * Continuous PDF viewer. Pages are rendered fit-to-width and stacked, and the
 * viewport scrolls freely through them — deliberately no scroll snapping,
 * which hijacks the gesture and makes short drags jump a whole page.
 *
 * Only pages near the viewport are rasterised; the rest reserve their exact
 * height up front (from the page's intrinsic size) so nothing reflows under
 * the scroll position as they fill in.
 */
function PdfPager({ stored, pages }: { stored: StoredFile; pages: number[] }) {
  const [handle, setHandle] = useState<PdfHandle | null>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [ratios, setRatios] = useState<number[]>([])
  const [current, setCurrent] = useState(0)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
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

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const apply = () => setBoxWidth(el.clientWidth)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [handle])

  // Height/width per page, so each slot can reserve its space before drawing.
  useEffect(() => {
    if (!handle) return
    let cancelled = false
    Promise.all(pages.map((n) => handle.pageSize(n).then((s) => s.height / s.width)))
      .then((next) => {
        if (!cancelled) setRatios(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, pages.join(',')])

  const pageWidth = Math.max(0, boxWidth - PAGE_INSET * 2)

  // Anything already drawn is at the old width, so a resize invalidates it.
  useEffect(() => {
    renderedRef.current = new Set()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth, handle, pages.join(',')])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!handle || !scroller || !pageWidth || ratios.length !== pages.length) return
    const draw = (i: number) => {
      if (renderedRef.current.has(i)) return
      const canvas = canvasRefs.current[i]
      if (!canvas) return
      renderedRef.current.add(i)
      void handle.renderPage(pages[i], canvas, pageWidth)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) draw(Number((entry.target as HTMLElement).dataset.i))
        }
      },
      { root: scroller, rootMargin: '600px 0px' },
    )
    pageRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, pageWidth, ratios, pages.join(',')])

  const goTo = (index: number) => {
    const scroller = scrollerRef.current
    const target = pageRefs.current[Math.min(Math.max(index, 0), pages.length - 1)]
    if (scroller && target) {
      scroller.scrollTo({ top: target.offsetTop - PAGE_INSET, behavior: 'smooth' })
    }
  }

  if (!handle) {
    return (
      <div className={`grid place-items-center ${VIEWER_BOX}`}>
        <Spinner size={26} />
      </div>
    )
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={(e) => {
          // Whichever page covers the middle of the viewport is "current".
          const scroller = e.currentTarget
          const middle = scroller.scrollTop + scroller.clientHeight / 2
          let index = 0
          pageRefs.current.forEach((el, i) => {
            if (el && el.offsetTop <= middle) index = i
          })
          setCurrent(index)
        }}
        className={`relative overflow-y-auto ${VIEWER_BOX}`}
      >
        <div className="flex flex-col items-center" style={{ gap: PAGE_INSET, padding: PAGE_INSET }}>
          {pages.map((pageNumber, i) => (
            <div
              key={pageNumber}
              data-i={i}
              ref={(el) => {
                pageRefs.current[i] = el
              }}
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[i] = el
                }}
                // Reserved before render, then overwritten by renderPage with
                // the same numbers — so the page never resizes as it appears.
                style={{
                  width: pageWidth || undefined,
                  height: pageWidth ? pageWidth * (ratios[i] ?? 1.414) : undefined,
                }}
                className="block rounded-[6px] bg-white shadow-lift"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => goTo(current - 1)}
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
          onClick={() => goTo(current + 1)}
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
          {/* Always a PDF: images are converted before they get this far, so
              the preview shows the exact document that will be printed. */}
          <div className="overflow-hidden rounded-[16px] bg-chip/40">
            <PdfPager stored={config.stored} pages={pages} />
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

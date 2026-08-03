/**
 * Lazy pdf.js bootstrap. Nothing here loads until a PDF is actually
 * uploaded/previewed, keeping pdfjs-dist out of the initial bundle.
 * The worker is wired via Vite's `?url` import.
 */

type Pdfjs = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<Pdfjs> | null = null

async function getPdfjs(): Promise<Pdfjs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })()
  }
  return pdfjsPromise
}

/** Real page count for an uploaded PDF. */
export async function countPdfPages(data: ArrayBuffer): Promise<number> {
  const pdfjs = await getPdfjs()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) })
  const doc = await loadingTask.promise
  const pages = doc.numPages
  await loadingTask.destroy()
  return pages
}

export interface PdfHandle {
  numPages: number
  /** Renders one page into the canvas, sized to targetWidth CSS px (DPR-aware). */
  renderPage: (pageNumber: number, canvas: HTMLCanvasElement, targetWidth: number) => Promise<void>
  /**
   * Intrinsic page size at scale 1. Cheap (metadata only, no rasterising) —
   * used to reserve the right height for a page before it renders, so the
   * viewer doesn't reflow underneath the scroll position.
   */
  pageSize: (pageNumber: number) => Promise<{ width: number; height: number }>
  destroy: () => void
}

/** Opens a PDF for the print-preview thumbnails. */
export async function openPdf(data: ArrayBuffer): Promise<PdfHandle> {
  const pdfjs = await getPdfjs()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) })
  const doc = await loadingTask.promise
  return {
    numPages: doc.numPages,
    async renderPage(pageNumber, canvas, targetWidth) {
      const page = await doc.getPage(pageNumber)
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const scale = (targetWidth / base.width) * dpr
      const viewport = page.getViewport({ scale })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
      const canvasContext = canvas.getContext('2d')
      if (!canvasContext) return
      await page.render({ canvasContext, canvas, viewport }).promise
    },
    async pageSize(pageNumber) {
      const page = await doc.getPage(pageNumber)
      const { width, height } = page.getViewport({ scale: 1 })
      return { width, height }
    },
    destroy() {
      void loadingTask.destroy()
    },
  }
}

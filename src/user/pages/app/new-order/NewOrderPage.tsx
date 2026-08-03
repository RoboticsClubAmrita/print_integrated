import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { FolderDropZone } from '@/components/app/FolderDropZone'
import { UploadOverlay } from '@/components/app/UploadOverlay'
import { ConfigCard } from '@/pages/app/new-order/ConfigCard'
import { SummaryPanel } from '@/pages/app/new-order/SummaryPanel'
import { PrintPreview, type PreviewConfig } from '@/pages/app/new-order/PrintPreview'
import {
  detectPages,
  getFile,
  mergeFilesIntoPdf,
  putFile,
  revokeFile,
  type StoredFile,
} from '@/services/fileService'
import { placeOrder } from '@/services/orderService'
import { printCost } from '@/lib/pricing'
import { delay } from '@/lib/delay'
import { useAppStore, activeOrders, totalDue, DEMO_JOB_ID } from '@/store/appStore'
import { DemoHint } from '@/components/app/DemoHint'
import { showSuccess, toast } from '@/store/uiStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { PrintSide } from '@/types'

/** Minimum time the upload overlay stays up so its staged captions are readable. */
const UPLOAD_OVERLAY_MIN_MS = 2400

export default function NewOrderPage() {
  useDocumentTitle('New Order')
  const navigate = useNavigate()

  const user = useAppStore((s) => s.user)
  const orders = useAppStore((s) => s.orders)
  const locations = useAppStore((s) => s.locations)
  const selectedLocationId = useAppStore((s) => s.selectedLocationId)
  const setSelectedLocation = useAppStore((s) => s.setSelectedLocation)
  const demoMode = useAppStore((s) => s.demoMode)
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const injectDemoOrder = useAppStore((s) => s.injectDemoOrder)
  const removeDemoOrder = useAppStore((s) => s.removeDemoOrder)
  const [demoHintDismissed, setDemoHintDismissed] = useState(false)

  const [fileId, setFileId] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [side, setSide] = useState<PrintSide>('SINGLE')
  const [selectedPages, setSelectedPages] = useState<number[] | null>(null)
  const [copies, setCopies] = useState(1)
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [placing, setPlacing] = useState(false)

  const stored = fileId ? (getFile(fileId) ?? null) : null

  // Revoke the object URL of whatever file is currently held on unmount.
  const storedRef = useRef<StoredFile | null>(null)
  storedRef.current = stored
  useEffect(() => () => {
    if (storedRef.current) revokeFile(storedRef.current.fileId)
  }, [])

  const resetFile = () => {
    if (stored) revokeFile(stored.fileId)
    setFileId(null)
    setSelectedFiles([])
    setTotalPages(null)
    setSelectedPages(null)
    setDetecting(false)
  }

  const onFiles = async (files: File[]) => {
    if (stored) revokeFile(stored.fileId)

    setFileId(null)
    setSelectedFiles(files)
    setTotalPages(null)
    setSelectedPages(null)
    setDetecting(true)

    const startedAt = Date.now()
    let next: StoredFile | null = null

    try {
      const mergedFile = await mergeFilesIntoPdf(files)
      next = putFile(mergedFile)
      setFileId(next.fileId)

      const pages = await detectPages(next)
      const remainingOverlayTime =
        UPLOAD_OVERLAY_MIN_MS - (Date.now() - startedAt)

      if (remainingOverlayTime > 0) {
        await delay(remainingOverlayTime)
      }

      setTotalPages(pages)
    } catch (error) {
      if (next) {
        revokeFile(next.fileId)
      }

      setFileId(null)
      setSelectedFiles([])
      setTotalPages(null)
      setSelectedPages(null)

      toast(
        'Unable to merge files',
        error instanceof Error
          ? error.message
          : 'The selected files could not be merged into one PDF.',
        'warning',
      )
    } finally {
      setDetecting(false)
    }
  }

  const selectedPageCount = selectedPages ? selectedPages.length : (totalPages ?? 0)
  const estimate = printCost({ pages: selectedPageCount, copies, side })
  const selectedLocation = locations.find((l) => l.id === selectedLocationId) ?? null

  const canSubmit = !!stored && totalPages !== null && !detecting && !!selectedLocationId

  const previewConfig: PreviewConfig | null =
    stored && totalPages !== null
      ? {
          stored,
          totalPages,
          selectedPages,
          copies,
          side,
          scheduledFor,
          location: selectedLocation,
          estimate,
        }
      : null

  const confirmOrder = async () => {
    if (!stored || totalPages === null || !user) return
    setPlacing(true)
    try {
      if (demoMode) {
        // Briefly show a real-looking order ticket, then clean it up and
        // explain what just happened — nothing here is ever sent to the
        // backend or persisted.
        injectDemoOrder({
          id: 'DEMO-0001',
          jobId: DEMO_JOB_ID,
          userId: user.id,
          fileName: stored.file.name,
          fileSizeKb: stored.sizeKb,
          pages: selectedPageCount,
          totalDocPages: totalPages,
          copies,
          side,
          colorMode: 'BW',
          pageType: 'A4',
          selectedPages,
          createdAt: new Date().toISOString(),
          scheduleType: scheduledFor ? 'SCHEDULED' : 'NOW',
          scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
          status: 'PENDING',
          costPerPage: 0,
          printCost: estimate,
          balanceApplied: 0,
          totalCost: estimate,
          locationId: selectedLocationId,
          locationName: selectedLocation?.name ?? null,
          stackName: null,
          collectedStackName: null,
          nextTransitionAt: null,
        })
        setPreviewOpen(false)
        navigate('/app/orders')

        await delay(2000)
        removeDemoOrder()
        setDemoMode(false)
        showSuccess({
          title: 'This is how an order is placed',
          subtitle: 'A real order stays right here until you collect it.',
          icon: 'check',
        })
        navigate('/app')
        return
      }

      const order = await placeOrder({
        file: stored.file,
        fileName: stored.file.name,
        fileSizeKb: stored.sizeKb,
        totalDocPages: totalPages,
        selectedPages,
        copies,
        side,
        scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
        locationId: selectedLocationId,
        locationName: selectedLocation?.name ?? null,
      })
      setPreviewOpen(false)
      showSuccess({
        title: 'Order Placed',
        subtitle: `${order.id} • ${order.fileName}`,
        icon: 'check',
      })
      navigate(`/app/orders/${order.id}`)
    } finally {
      setPlacing(false)
    }
  }

  const latest = orders[0]

  return (
    <>
      {/* ————— Hero: headline left, editorial stats right ————— */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[2.4px] text-muted">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <h1 className="mt-2.5 text-[30px] font-extrabold leading-[1.08] tracking-[-0.8px] text-ink sm:text-[34px]">
            Print your docs,
            <br />
            skip the queue.
          </h1>
          <p className="mt-2.5 text-[14.5px] font-medium text-muted">
            Hi {user?.name?.split(' ')[0] ?? 'there'} 👋 — upload, configure and collect with a
            code.
          </p>
        </div>

        <div className="hidden items-stretch divide-x divide-line md:flex">
          <Stat value={String(activeOrders(orders).length)} label="active orders" to="/app/orders" />
          <Stat value={`₹${totalDue(orders)}`} label="payment due" to="/app/billing" />
          {latest && (
            <Link
              to={`/app/orders/${latest.id}`}
              className="group flex max-w-[210px] flex-col justify-center px-6 pr-0"
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-success" />
                <span className="truncate text-[13.5px] font-bold text-ink">{latest.fileName}</span>
                <ArrowUpRight
                  size={13}
                  strokeWidth={2.4}
                  className="shrink-0 text-muted transition-colors group-hover:text-ink"
                />
              </span>
              <span className="mt-1 text-[11.5px] font-semibold text-muted">latest order</span>
            </Link>
          )}
        </div>
      </div>

      {/* ————— Print console: 01 upload · 02 configure | 03 review —————
          Swapped out in place for the preview + confirm step below, so placing
          an order never navigates away from this page. Every field is held in
          this component's state, so unmounting the console preserves it. */}
      {!previewOpen && (
      <div className="mt-8 rounded-[20px] border border-line bg-white lg:grid lg:grid-cols-[1.12fr_0.88fr] lg:divide-x lg:divide-line">
        <div className="p-5 sm:p-7">
          <StepHeader n="01" title="Upload" />
          <div className="mt-4" data-tour="tour-upload">
            <FolderDropZone
              files={selectedFiles}
              onFiles={onFiles}
              onClear={resetFile}
            />
          </div>

          <DemoHint
            open={demoMode && !stored && !demoHintDismissed}
            targetId="tour-upload"
            message="Try uploading a file to see how ordering works — nothing here gets submitted for real."
            onDismiss={() => setDemoHintDismissed(true)}
          />

          <div className="mt-7 border-t border-line/80 pt-6">
            <StepHeader n="02" title="Configure" />
            <div className="mt-4">
              <ConfigCard
                side={side}
                onSideChange={setSide}
                totalPages={totalPages}
                detecting={detecting}
                selectedPages={selectedPages}
                onPagesChange={setSelectedPages}
                copies={copies}
                onCopiesChange={setCopies}
                scheduledFor={scheduledFor}
                onScheduleChange={setScheduledFor}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-line p-5 sm:p-7 lg:border-t-0">
          <div className="lg:sticky lg:top-[88px]">
            <StepHeader n="03" title="Review & place" />
            <div className="mt-4">
              <SummaryPanel
                locations={locations}
                selectedLocationId={selectedLocationId}
                onLocationChange={setSelectedLocation}
                pages={selectedPageCount}
                copies={copies}
                side={side}
                estimate={estimate}
                disabled={!canSubmit}
                loading={false}
                onSubmit={() => setPreviewOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>
      )}

      <PrintPreview
        open={previewOpen}
        config={previewConfig}
        confirming={placing}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={confirmOrder}
      />

      {/* Mobile: summary collapses into a sticky bar above the dock. Hidden
          during preview — the confirm action lives in the preview itself. */}
      <div hidden={previewOpen} className="lg:hidden fixed bottom-[100px] inset-x-4 z-30">
        <div className="dark-panel relative overflow-hidden rounded-[22px] px-5 py-4 flex items-center justify-between gap-4">
          <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
          <div className="relative">
            <p className="text-[11px] font-semibold text-white/55">Estimated Total</p>
            <p className="text-[22px] font-extrabold tracking-[-0.4px] text-white">₹{estimate}</p>
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => setPreviewOpen(true)}
            className="relative press h-12 px-6 rounded-[14px] bg-white text-ink font-bold text-[14px] disabled:opacity-40"
          >
            Place Order
          </button>
        </div>
      </div>

      <UploadOverlay
        open={detecting}
        fileName={
          selectedFiles.length === 1
            ? selectedFiles[0].name
            : `${selectedFiles.length} files`
        }
      />
    </>
  )
}

/** Numbered step heading inside the print console. */
function StepHeader({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="text-[11px] font-extrabold tabular-nums tracking-[1px] text-muted/70">
        {n}
      </span>
      <h2 className="text-[15px] font-extrabold tracking-[-0.2px] text-ink">{title}</h2>
    </div>
  )
}

/** Editorial hero stat — a quiet number + label pair that links onward. */
function Stat({ value, label, to }: { value: string; label: string; to: string }) {
  return (
    <Link to={to} className="group flex flex-col justify-center px-6 first:pl-0">
      <span className="text-[22px] font-extrabold tabular-nums tracking-[-0.5px] text-ink">
        {value}
      </span>
      <span className="mt-1 text-[11.5px] font-semibold text-muted transition-colors group-hover:text-ink">
        {label}
      </span>
    </Link>
  )
}
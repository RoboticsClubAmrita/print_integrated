import { useState } from 'react'
import { clsx } from 'clsx'
import { ArrowLeft, Eye, FileText, SearchX } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { DocumentViewer } from '@/components/app/DocumentViewer'
import { TicketCard } from '@/components/app/TicketCard'
import { StatusChip } from '@/components/app/StatusChip'
import { StatusTimeline } from '@/components/app/StatusTimeline'
import { CostBreakdown } from '@/components/app/CostBreakdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ActionCard } from '@/pages/app/order-detail/ActionCard'
import { useAppStore } from '@/store/appStore'
import { SIDE_LABELS } from '@/lib/orders'
import { formatDateTimeDot } from '@/lib/format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orders = useAppStore((s) => s.orders)
  const order = orders.find((o) => o.id === id)
  const [viewerOpen, setViewerOpen] = useState(false)

  useDocumentTitle(order ? order.id : 'Order not found')

  if (!order) {
    return (
      <EmptyState
        icon={SearchX}
        title="Order not found"
        body="This order may have been removed or the link is incorrect."
        action={<Button onClick={() => navigate('/app/orders')}>Back to Orders</Button>}
      />
    )
  }

  // Every document is a PDF now — it is converted before it is ever ordered.
  const Icon = FileText
  const copiesLabel = `${order.copies} ${order.copies === 1 ? 'copy' : 'copies'}`
  const scheduleLabel =
    order.scheduleType === 'SCHEDULED' && order.scheduledFor
      ? formatDateTimeDot(order.scheduledFor)
      : 'Printed now'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('/app/orders')}
          className="press grid place-items-center size-10 rounded-full bg-chip hover:bg-line/70 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-ink">Order Details</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <TicketCard
            top={
              <div className="flex items-center gap-3">
                <span className="grid place-items-center size-11 rounded-[14px] bg-chip shrink-0">
                  <Icon size={19} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-ink truncate">{order.fileName}</p>
                  <p className="text-[12px] font-medium text-muted mt-0.5">
                    {order.id} • {order.fileSizeKb} KB
                  </p>
                </div>
                <StatusChip status={order.status} />
              </div>
            }
            bottom={
              <div className="flex flex-wrap items-center gap-1.5">
                {[SIDE_LABELS[order.side], `${order.pages} pages`, copiesLabel, scheduleLabel].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="px-2.5 py-1 rounded-full bg-chip text-[11.5px] font-bold text-muted"
                    >
                      {chip}
                    </span>
                  ),
                )}
                {/* Always shown, so the preview is a visible part of an order
                    rather than something that quietly disappears. It is
                    disabled — with the reason on hover — once the document is
                    no longer readable: 24 hours after collection it is deleted
                    for good. */}
                <button
                  type="button"
                  disabled={!order.documentAvailable}
                  title={
                    order.documentAvailable
                      ? 'Open this order\u2019s document'
                      : order.fileId
                        ? 'This document has been deleted — documents are kept until 24 hours after collection'
                        : 'There is no document on this order'
                  }
                  onClick={() => setViewerOpen(true)}
                  className={clsx(
                    'ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold',
                    order.documentAvailable
                      ? 'press bg-ink text-white'
                      : 'cursor-not-allowed bg-chip text-muted',
                  )}
                >
                  <Eye size={13} strokeWidth={2.2} aria-hidden />
                  View document
                </button>
              </div>
            }
          />

          <CostBreakdown order={order} />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
          <div className="card p-6">
            <h2 className="text-[18px] font-extrabold tracking-[-0.2px] mb-5">Order Status</h2>
            <StatusTimeline status={order.status} />
          </div>

          <ActionCard order={order} />
        </div>
      </div>

      <DocumentViewer order={order} open={viewerOpen} onClose={() => setViewerOpen(false)} />
    </div>
  )
}

import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import type { Order } from '@/types'
import { Button } from '@/components/ui/Button'
import { CollectOtpModal } from '@/components/app/CollectOtpModal'
import { PendingDuesDialog } from '@/components/app/PendingDuesDialog'
import { orderCost } from '@/lib/orders'
import { rupees } from '@/lib/pricing'
import { formatDateTimeDot } from '@/lib/format'
import { payOrder } from '@/services/billingService'
import { cancelOrder } from '@/services/orderService'
import { outstandingDues, useAppStore } from '@/store/appStore'
import { showSuccess, toast } from '@/store/uiStore'

/**
 * Status-conditional bottom action (order_detail_screen.dart): Pay / Cancel /
 * info text / Request Collection (gated by outstanding dues) / thank-you.
 * Renders nothing for CANCELLED/FAILED, matching the app.
 */
export function ActionCard({ order }: { order: Order }) {
  const penalties = useAppStore((s) => s.penalties)
  const dues = outstandingDues(penalties)

  const [payBusy, setPayBusy] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [duesOpen, setDuesOpen] = useState(false)
  const [collectOpen, setCollectOpen] = useState(false)

  const pay = async () => {
    setPayBusy(true)
    try {
      await payOrder(order)
      showSuccess({
        title: 'Payment Successful',
        subtitle: `${rupees(orderCost(order))} paid for ${order.fileName}.`,
      })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Payment failed', undefined, 'warning')
    } finally {
      setPayBusy(false)
    }
  }

  const cancel = async () => {
    setCancelBusy(true)
    await cancelOrder(order.jobId)
    setCancelBusy(false)
  }

  const requestCollection = () => {
    if (dues > 0) {
      setDuesOpen(true)
      return
    }
    setCollectOpen(true)
  }

  if (order.status === 'CANCELLED' || order.status === 'FAILED') return null

  return (
    <div className="card p-6">
      {order.status === 'PENDING' && (
        <Button fullWidth loading={payBusy} onClick={pay}>
          {payBusy ? 'Processing…' : `Pay ${rupees(orderCost(order))}`}
        </Button>
      )}

      {order.status === 'SCHEDULED' && (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] font-semibold text-muted">
            Scheduled for {order.scheduledFor ? formatDateTimeDot(order.scheduledFor) : '—'}
          </p>
          <Button variant="danger" fullWidth loading={cancelBusy} onClick={cancel}>
            Cancel Order
          </Button>
        </div>
      )}

      {order.status === 'QUEUED' && (
        <Button variant="danger" fullWidth loading={cancelBusy} onClick={cancel}>
          Cancel Order
        </Button>
      )}

      {order.status === 'PRINTING' && (
        <p className="text-[14px] font-semibold text-ink text-center py-2">
          Your document is printing now.
        </p>
      )}

      {order.status === 'PRINTED_PENDING_STACK' && (
        <p className="text-[13.5px] font-medium text-muted text-center leading-relaxed py-2">
          Your document is printed and waiting for a free pickup slot. We&apos;ll notify you the
          moment it&apos;s ready to collect.
        </p>
      )}

      {order.status === 'COMPLETED' && (
        <div className="flex flex-col gap-3">
          {order.stackName && (
            <p className="text-[13.5px] font-semibold text-muted text-center">
              Collect from Stack {order.stackName}
            </p>
          )}
          <Button fullWidth onClick={requestCollection}>
            Request Collection
          </Button>
        </div>
      )}

      {order.status === 'COLLECTED' && (
        <div className="flex items-center gap-3 justify-center text-center py-2">
          <PackageCheck size={20} className="text-success shrink-0" strokeWidth={2} />
          <p className="text-[14px] font-bold text-ink">
            {order.collectedStackName
              ? `Collected from Stack ${order.collectedStackName} — thank you!`
              : 'Collected — thank you!'}
          </p>
        </div>
      )}

      <PendingDuesDialog open={duesOpen} amount={dues} onClose={() => setDuesOpen(false)} />
      <CollectOtpModal
        open={collectOpen}
        order={order}
        onClose={() => setCollectOpen(false)}
        onCollected={() => setCollectOpen(false)}
      />
    </div>
  )
}

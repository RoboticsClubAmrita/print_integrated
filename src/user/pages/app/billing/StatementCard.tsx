import { useState } from 'react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui/Button'
import { payAllDue } from '@/services/billingService'
import { showSuccess, toast } from '@/store/uiStore'
import { rupees } from '@/lib/pricing'

/**
 * Dark statement card (billing_screen.dart): animated TOTAL DUE — this
 * intentionally includes CANCELLED/FAILED order costs, matching the app's
 * `unpaidOrders` quirk (see store/appStore.ts). "Pay Now" walks every
 * pending order through the mock checkout sequentially.
 */
export function StatementCard({
  totalDue,
  unpaidCount,
}: {
  totalDue: number
  unpaidCount: number
}) {
  const [paying, setPaying] = useState(false)

  const payNow = async () => {
    setPaying(true)
    try {
      const cleared = await payAllDue()
      if (cleared > 0) {
        showSuccess({
          title: 'Payment Successful',
          subtitle: `${rupees(cleared)} cleared — you are all set.`,
        })
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Payment failed', undefined, 'warning')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="dark-panel relative overflow-hidden rounded-[28px] p-6">
      <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
      <div className="relative">
        <p className="text-[12.5px] font-semibold text-white/50 tracking-wide uppercase">
          Total Due
        </p>
        <AnimatedNumber
          value={totalDue}
          className="block text-[42px] font-extrabold tracking-[-1px] text-white mt-1"
        />
        <p className="mt-1.5 text-[13.5px] font-medium text-white/60">
          {totalDue === 0
            ? 'No pending payments — all clear ✨'
            : `across ${unpaidCount} unpaid order${unpaidCount === 1 ? '' : 's'}`}
        </p>
        <Button
          variant="onDark"
          fullWidth
          className="mt-6"
          disabled={totalDue === 0}
          loading={paying}
          onClick={payNow}
        >
          Pay Now
        </Button>
      </div>
    </div>
  )
}

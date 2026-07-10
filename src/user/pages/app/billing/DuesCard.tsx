import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { payOutstandingDues } from '@/services/billingService'
import { showSuccess, toast } from '@/store/uiStore'
import { penaltyRemaining } from '@/store/appStore'
import { rupees } from '@/lib/pricing'
import type { Penalty } from '@/types'

/** Outstanding storage-fee ledger (billing_screen.dart) — hidden when zero. */
export function DuesCard({ penalties, total }: { penalties: Penalty[]; total: number }) {
  const [paying, setPaying] = useState(false)
  const open = penalties.filter((p) => penaltyRemaining(p) > 0)

  if (total <= 0) return null

  const payDues = async () => {
    setPaying(true)
    try {
      const amount = await payOutstandingDues()
      showSuccess({ title: 'Dues Cleared', subtitle: `${rupees(amount)} paid — you are all set.` })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Payment failed', undefined, 'warning')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="card p-6 border-warning/25">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="grid place-items-center size-9 rounded-full bg-warning/14 shrink-0">
          <AlertTriangle size={17} className="text-warning" strokeWidth={2} />
        </span>
        <h2 className="text-[16px] font-extrabold tracking-[-0.2px] text-ink">Outstanding Dues</h2>
        <span className="ml-auto text-[17px] font-extrabold text-ink">{rupees(total)}</span>
      </div>
      <p className="text-[13px] font-medium text-muted leading-relaxed mb-4">
        Storage fees from uncollected prints left in a stack past the free window.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {open.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-[13.5px]">
            <span className="font-semibold text-muted">{p.referenceId}</span>
            <span className="font-bold text-ink">{rupees(penaltyRemaining(p))}</span>
          </div>
        ))}
      </div>

      <Button variant="danger" fullWidth loading={paying} onClick={payDues}>
        Pay Dues
      </Button>
    </div>
  )
}

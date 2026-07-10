import { StatementCard } from '@/pages/app/billing/StatementCard'
import { DuesCard } from '@/pages/app/billing/DuesCard'
import { BreakdownAccordion } from '@/pages/app/billing/BreakdownAccordion'
import { PaymentHistory } from '@/pages/app/billing/PaymentHistory'
import { outstandingDues, paidOrders, totalDue, unpaidOrders, useAppStore } from '@/store/appStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function BillingPage() {
  useDocumentTitle('Billing')
  const orders = useAppStore((s) => s.orders)
  const penalties = useAppStore((s) => s.penalties)

  const unpaid = unpaidOrders(orders)
  const paid = paidOrders(orders)
  const due = totalDue(orders)
  const dues = outstandingDues(penalties)

  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.5px] text-ink">Billing</h1>
      <p className="mt-1 text-[13.5px] font-medium text-muted">Order-wise costs and dues</p>

      <div className="mt-6 grid lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
          <StatementCard totalDue={due} unpaidCount={unpaid.length} />
          <DuesCard penalties={penalties} total={dues} />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <BreakdownAccordion orders={unpaid} />
          <PaymentHistory orders={paid} />
        </div>
      </div>
    </div>
  )
}

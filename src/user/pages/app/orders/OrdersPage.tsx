import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Inbox, PackageCheck, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { OrderTicket } from '@/components/app/OrderTicket'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { activeOrders, historyOrders, useAppStore } from '@/store/appStore'
import { delay } from '@/lib/delay'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { staggerParent, fadeSlideChild, DUR, EASE } from '@/lib/motion'

type Tab = 'ACTIVE' | 'HISTORY'

export default function OrdersPage() {
  useDocumentTitle('Orders')
  const navigate = useNavigate()
  const orders = useAppStore((s) => s.orders)
  const refresh = useAppStore((s) => s.refresh)
  const [tab, setTab] = useState<Tab>('ACTIVE')
  const [refreshing, setRefreshing] = useState(false)

  const active = activeOrders(orders)
  const history = historyOrders(orders)
  const shown = tab === 'ACTIVE' ? active : history

  const doRefresh = async () => {
    setRefreshing(true)
    await delay(400)
    refresh()
    setRefreshing(false)
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'ACTIVE', label: 'Active', count: active.length },
    { key: 'HISTORY', label: 'History', count: history.length },
  ]

  return (
    <div>
      {/* ————— Page header ————— */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[2.4px] text-muted">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Your prints
          </p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-none tracking-[-0.8px] text-ink sm:text-[32px]">
            Orders
          </h1>
        </div>
        <button
          type="button"
          aria-label="Refresh"
          onClick={doRefresh}
          disabled={refreshing}
          className="press grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-ink"
        >
          {refreshing ? <Spinner size={17} /> : <RefreshCw size={17} strokeWidth={2} />}
        </button>
      </div>

      {/* ————— Underline tabs ————— */}
      <div role="tablist" aria-label="Order lists" className="mt-7 flex gap-7 border-b border-line">
        {tabs.map((t) => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              className="group relative flex items-baseline gap-1.5 pb-3"
            >
              <span
                className={clsx(
                  'text-[14px] font-bold tracking-[-0.1px] transition-colors duration-180',
                  isActive ? 'text-ink' : 'text-muted group-hover:text-ink',
                )}
              >
                {t.label}
              </span>
              <span
                className={clsx(
                  'text-[12px] font-bold tabular-nums transition-colors duration-180',
                  isActive ? 'text-muted' : 'text-muted/60',
                )}
              >
                {t.count}
              </span>
              {isActive && (
                <motion.span
                  layoutId="orders-tab"
                  transition={{ duration: DUR.normal, ease: EASE }}
                  className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-ink"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ————— Tickets ————— */}
      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState
            icon={tab === 'ACTIVE' ? Inbox : PackageCheck}
            title={tab === 'ACTIVE' ? 'Nothing printing right now' : 'No collected orders yet'}
            body={tab === 'ACTIVE' ? 'Start a print and track it here.' : undefined}
            action={
              tab === 'ACTIVE' ? (
                <Button onClick={() => navigate('/app')}>Start a print</Button>
              ) : undefined
            }
          />
        ) : (
          <motion.div
            key={tab}
            variants={staggerParent(0.05)}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2"
          >
            {shown.map((order) => (
              <motion.div key={order.id} variants={fadeSlideChild}>
                <OrderTicket order={order} onClick={() => navigate(`/app/orders/${order.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

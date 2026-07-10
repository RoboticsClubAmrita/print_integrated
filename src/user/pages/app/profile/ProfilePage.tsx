import { useState } from 'react'
import { ChevronRight, Info, LogOut, Pencil, Receipt } from 'lucide-react'
import { WalkthroughOverlay } from '@/components/app/WalkthroughOverlay'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { EditProfileModal } from '@/pages/app/profile/EditProfileModal'
import { RatesSheet } from '@/pages/app/profile/RatesSheet'
import { AboutSheet } from '@/pages/app/profile/AboutSheet'
import { historyOrders, totalSpent, useAppStore } from '@/store/appStore'
import { logout } from '@/services/authService'
import { initials } from '@/lib/format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-[18px] bg-chip px-4 py-3.5 text-center">
      <AnimatedNumber
        value={value}
        format={(n) => `${n}`}
        className="block text-[20px] font-extrabold text-ink"
      />
      <p className="text-[11.5px] font-semibold text-muted mt-0.5">{label}</p>
    </div>
  )
}

function ActionRow({
  icon: Icon,
  label,
  subtitle,
  onClick,
}: {
  icon: typeof Pencil
  label: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3.5 py-4 border-b border-line/60 last:border-0 hover:bg-chip/60 transition-colors -mx-2 px-2 rounded-[12px]"
    >
      <span className="grid place-items-center size-10 rounded-[12px] bg-chip shrink-0">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <span className="flex-1 text-left min-w-0">
        <span className="block text-[14.5px] font-bold text-ink">{label}</span>
        <span className="block text-[12px] font-medium text-muted truncate">{subtitle}</span>
      </span>
      <ChevronRight size={17} className="text-muted shrink-0" />
    </button>
  )
}

export default function ProfilePage() {
  useDocumentTitle('Profile')
  const user = useAppStore((s) => s.user)
  const orders = useAppStore((s) => s.orders)

  const [editOpen, setEditOpen] = useState(false)
  const [ratesOpen, setRatesOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  if (!user) return null

  const collected = historyOrders(orders).length
  const spent = totalSpent(orders)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="dark-panel relative overflow-hidden rounded-[28px] p-7 text-center">
        <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
        <div className="relative">
          <div className="mx-auto grid place-items-center size-16 rounded-full bg-white/12 border border-white/15 text-white font-extrabold text-[20px]">
            {initials(user.name)}
          </div>
          <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.3px] text-white">
            {user.name}
          </h1>
          <p className="text-[13.5px] font-medium text-white/60">{user.email}</p>
          <span className="inline-block mt-3 px-3 py-1.5 rounded-full bg-white/10 border border-white/12 text-[12px] font-bold text-white/85">
            ⚡ PrintEase Member
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <StatChip label="Orders" value={orders.length} />
        <StatChip label="Collected" value={collected} />
        <StatChip label="Spent ₹" value={spent} />
      </div>

      <div className="mt-6">
        <p className="text-[12.5px] font-bold text-muted uppercase tracking-wide mb-2 px-2">
          Account
        </p>
        <div className="card p-4">
          <ActionRow
            icon={Pencil}
            label="Edit Profile"
            subtitle="Update your name, email and phone"
            onClick={() => setEditOpen(true)}
          />
          <ActionRow
            icon={Receipt}
            label="Print Rates"
            subtitle="Per-page and per-sheet pricing"
            onClick={() => setRatesOpen(true)}
          />
          <ActionRow
            icon={Info}
            label="About PrintEase"
            subtitle="Campus printing, minus the queue"
            onClick={() => setAboutOpen(true)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={logout}
        className="press mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-[16px] border-[1.5px] border-line text-danger font-bold text-[14.5px] hover:bg-danger/5 transition-colors"
      >
        <LogOut size={17} strokeWidth={2} />
        Log Out
      </button>

      <EditProfileModal open={editOpen} user={user} onClose={() => setEditOpen(false)} />
      <RatesSheet open={ratesOpen} onClose={() => setRatesOpen(false)} />
      <AboutSheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onViewDemo={() => {
          setAboutOpen(false)
          setDemoOpen(true)
        }}
      />
      <WalkthroughOverlay open={demoOpen} onFinish={() => setDemoOpen(false)} skipLabel="Close" />
    </div>
  )
}

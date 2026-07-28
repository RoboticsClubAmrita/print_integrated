import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { House, ReceiptText, User, Wallet } from 'lucide-react'
import { clsx } from 'clsx'
import { DUR, EASE } from '@/lib/motion'

const TABS = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/orders', label: 'Orders', icon: ReceiptText, end: false },
  { to: '/app/billing', label: 'Billing', icon: Wallet, end: false },
  { to: '/app/profile', label: 'Profile', icon: User, end: false },
] as const

/**
 * Primary navigation, two placements:
 *
 * `inline` (desktop header) — quiet text tabs; the active tab carries an ink
 * pill that glides between tabs via a shared-layout animation. No icons, no
 * dark chrome: the header stays calm and typographic.
 *
 * `floating-bottom` (mobile) — the brand's floating dark dock (bottom_nav.dart):
 * icon tabs where the selected one expands into a white pill revealing its
 * label. Thumb-reach navigation, unchanged.
 */
export function DockNav({ placement }: { placement: 'inline' | 'floating-bottom' }) {
  if (placement === 'inline') {
    return (
      <nav aria-label="Primary" className="flex items-center gap-1" data-tour="tour-nav">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className="relative rounded-full">
            {({ isActive }) => (
              <span className="relative flex h-9 items-center px-4">
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ duration: DUR.normal, ease: EASE }}
                    className="absolute inset-0 rounded-full bg-ink"
                  />
                )}
                <span
                  className={clsx(
                    'relative z-10 text-[13.5px] font-bold tracking-[-0.1px] transition-colors duration-180',
                    isActive ? 'text-white' : 'text-muted hover:text-ink',
                  )}
                >
                  {tab.label}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav
      aria-label="Primary"
      data-tour="tour-nav"
      className="dark-panel fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-[30px] p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-dock"
    >
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} aria-label={tab.label} className="relative">
          {({ isActive }) => (
            <span
              className={clsx(
                'relative flex items-center gap-2 h-11 rounded-[22px] transition-[padding] duration-340',
                isActive ? 'px-4' : 'px-3.5',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="dock-pill"
                  transition={{ duration: DUR.normal, ease: EASE }}
                  className="absolute inset-0 rounded-[22px] bg-white shadow-pill"
                />
              )}
              <tab.icon
                size={19}
                strokeWidth={2}
                className={clsx('relative z-10', isActive ? 'text-ink' : 'text-white/65')}
              />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  transition={{ duration: DUR.normal, ease: EASE }}
                  className="relative z-10 overflow-hidden whitespace-nowrap text-[12.5px] font-extrabold text-ink"
                >
                  {tab.label}
                </motion.span>
              )}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

import { useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useAppStore } from '@/store/appStore'
import { useModeTransition } from '@/store/modeTransition'
import { initials } from '@/lib/format'
import { DUR, EASE } from '@/lib/motion'

/**
 * The header avatar / workspace control.
 *
 * Regular users: a plain avatar circle linking to the profile.
 *
 * ADMIN/SUPER_ADMIN users: the avatar sits inside an inline capsule slider.
 * Clicking the capsule track starts the mode transition — the screen floods
 * with ink (to the Press Room) or paper (back to the Storefront) from this
 * exact spot, and the route swaps beneath the flood. The capsule reads its
 * on/off state straight from the URL. Admin mode dresses the capsule with
 * the amber "operating" accent; clicking the avatar knob opens the profile.
 */
export function ProfileModeSwitch() {
  const navigate = useNavigate()
  const location = useLocation()
  const capsuleRef = useRef<HTMLDivElement>(null)
  const user = useAppStore((s) => s.user)
  const startTransition = useModeTransition((s) => s.start)
  const transitionActive = useModeTransition((s) => s.active)

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const adminMode = location.pathname.startsWith('/admin')
  const label = initials(user?.name ?? '')

  // Regular users: the avatar is just the profile shortcut it always was.
  if (!isAdmin) {
    return (
      <Link
        to="/app/profile"
        aria-label="Profile"
        className="press grid size-11 place-items-center rounded-full bg-ink text-[13px] font-extrabold text-white"
      >
        {label}
      </Link>
    )
  }

  const toggle = () => {
    if (transitionActive) return
    const el = capsuleRef.current
    const rect = el?.getBoundingClientRect()
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth - 90, y: 36 }
    startTransition(adminMode ? 'user' : 'admin', origin)
  }

  return (
    <div
      ref={capsuleRef}
      role="switch"
      aria-checked={adminMode}
      aria-label="Workspace mode — activate to toggle between User and Admin"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
      className={clsx(
        'group relative flex h-11 w-[138px] cursor-pointer select-none items-center rounded-full p-[4px] transition-shadow duration-300',
        adminMode ? 'flex-row-reverse' : 'flex-row',
      )}
      style={{
        background: 'linear-gradient(to bottom, #17171c, #0b0b0d)',
        boxShadow: adminMode
          ? 'inset 0 2px 6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 159 10 / 0.45), 0 0 16px rgb(255 159 10 / 0.16), 0 4px 12px rgb(0 0 0 / 0.18)'
          : 'inset 0 2px 6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.12), 0 4px 12px rgb(0 0 0 / 0.18)',
      }}
    >
      {/* Mode wordmark — swaps sides as the avatar slides past it. */}
      <motion.span
        layout
        transition={{ duration: DUR.normal, ease: EASE }}
        className="relative flex flex-1 flex-col items-center justify-center leading-none"
      >
        <span
          className={clsx(
            'font-extrabold italic text-[15px] leading-none tracking-[-0.6px] transition-colors duration-200',
            adminMode ? 'text-warning' : 'text-white/80 group-hover:text-white',
          )}
        >
          {adminMode ? 'Admin' : 'User'}
        </span>
        <span
          className={clsx(
            'mt-[3px] text-[7.5px] font-bold uppercase tracking-[2.5px] transition-colors duration-200',
            adminMode ? 'text-warning/60' : 'text-white/35 group-hover:text-white/55',
          )}
        >
          mode
        </span>
      </motion.span>

      {/* Avatar = the sliding knob. Clicking it opens the profile. */}
      <motion.button
        layout
        transition={{ duration: DUR.normal, ease: EASE }}
        type="button"
        aria-label="Open profile"
        title="Open profile"
        onClick={(e) => {
          e.stopPropagation()
          navigate('/app/profile')
        }}
        className="press relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-ink"
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #e9e9ee)',
          boxShadow: adminMode
            ? '0 0 0 1.5px rgb(255 159 10 / 0.75), 0 2px 6px rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.85), inset 0 -1px 2px rgb(0 0 0 / 0.08)'
            : '0 2px 6px rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.85), inset 0 -1px 2px rgb(0 0 0 / 0.08)',
        }}
      >
        {label}
      </motion.button>
    </div>
  )
}

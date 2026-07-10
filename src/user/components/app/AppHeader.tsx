import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { clsx } from 'clsx'
import { BrandMark } from '@/components/brand/BrandMark'
import { DockNav } from '@/components/app/DockNav'
import { IconButton } from '@/components/ui/IconButton'
import { NotificationsPopover } from '@/components/app/NotificationsPopover'
import { ProfileModeSwitch } from '@/components/app/ProfileModeSwitch'
import { useAppStore, unreadCount } from '@/store/appStore'
import { useDesktop } from '@/hooks/useMediaQuery'

/**
 * Sticky app header: brand, the dock centered inline on desktop (mobile
 * gets its own floating bottom dock instead), bell + notifications, and a
 * profile avatar shortcut.
 */
export function AppHeader() {
  const desktop = useDesktop()
  const notifications = useAppStore((s) => s.notifications)
  const lastSeen = useAppStore((s) => s.lastSeenNotificationsAt)
  const markSeen = useAppStore((s) => s.markNotificationsSeen)
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = unreadCount(notifications, lastSeen)

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-xl">
      <div
        className={clsx(
          'mx-auto max-w-[1180px] px-4 sm:px-6 h-16 flex items-center',
          desktop ? 'grid grid-cols-[1fr_auto_1fr]' : 'justify-between',
        )}
      >
        <Link to="/app" className="press-soft justify-self-start">
          <BrandMark size={34} />
        </Link>

        {desktop && (
          <div className="justify-self-center">
            <DockNav placement="inline" />
          </div>
        )}

        <div className="flex items-center gap-2.5 justify-self-end">
          <div className="relative">
            <IconButton
              icon={Bell}
              label="Notifications"
              variant="plain"
              badge={unread}
              onClick={() => {
                setNotifOpen((o) => !o)
                if (!notifOpen) markSeen()
              }}
            />
            <NotificationsPopover open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
          <ProfileModeSwitch />
        </div>
      </div>
    </header>
  )
}

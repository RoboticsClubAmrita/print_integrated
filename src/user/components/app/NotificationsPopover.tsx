import { AnimatePresence, motion } from 'motion/react'
import { BellOff } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { useAppStore } from '@/store/appStore'
import { useDesktop } from '@/hooks/useMediaQuery'
import { timeAgo } from '@/lib/format'
import { DUR, EASE } from '@/lib/motion'

function NotificationRow({ title, body, time }: { title: string; body: string; time: string }) {
  return (
    <div className="py-3 border-b border-line/60 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-extrabold text-ink">{title}</p>
        <span className="text-[11.5px] font-medium text-muted shrink-0">{timeAgo(time)}</span>
      </div>
      <p className="text-[13px] font-medium text-muted mt-0.5 leading-snug">{body}</p>
    </div>
  )
}

function NotificationList() {
  const notifications = useAppStore((s) => s.notifications)
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <BellOff size={26} className="text-muted mb-3" strokeWidth={1.6} />
        <p className="text-[14px] font-semibold text-muted">No notifications yet.</p>
      </div>
    )
  }
  return (
    <div>
      {notifications.map((n) => (
        <NotificationRow key={n.id} title={n.title} body={n.body} time={n.time} />
      ))}
    </div>
  )
}

/** Desktop: anchored dropdown near the bell. Mobile: bottom sheet. */
export function NotificationsPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const desktop = useDesktop()

  if (!desktop) {
    return (
      <Sheet open={open} onClose={onClose} title="Notifications">
        <NotificationList />
      </Sheet>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: DUR.fast, ease: EASE }}
            className="absolute right-0 top-[calc(100%+12px)] z-40 w-[380px] max-h-[70vh] overflow-y-auto bg-white rounded-[22px] border border-line shadow-lift p-4"
          >
            <h3 className="text-[15px] font-extrabold text-ink px-1 pb-1">Notifications</h3>
            <NotificationList />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

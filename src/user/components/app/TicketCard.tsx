import type { ReactNode } from 'react'
import { clsx } from 'clsx'

/**
 * Boarding-pass card (ticket_card.dart): two sections separated by a
 * perforation strip with punched side notches. The notches are CSS-masked
 * out of the strip, so the card sits correctly on ANY background —
 * including gradients (an upgrade over the Flutter notchColor prop).
 */
export function TicketCard({
  top,
  bottom,
  onClick,
  className,
}: {
  top: ReactNode
  bottom: ReactNode
  onClick?: () => void
  className?: string
}) {
  const interactive = !!onClick
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      {...(interactive ? { type: 'button' as const, onClick } : {})}
      className={clsx(
        'group relative block w-full text-left rounded-[20px]',
        interactive &&
          'press-soft transition-[transform,box-shadow] duration-340 ease-out-quart hover:-translate-y-[2px] hover:shadow-card cursor-pointer',
        className,
      )}
    >
      <div className="bg-white border border-line border-b-0 rounded-t-[20px] px-5 pt-[18px] pb-3 transition-colors duration-340 group-hover:border-muted/40 group-hover:border-b-0">
        {top}
      </div>
      <div className="ticket-notches relative h-6 bg-white border-x border-line transition-colors duration-340 group-hover:border-muted/40">
        <div aria-hidden className="absolute inset-y-0 inset-x-7 perforation" />
      </div>
      <div className="bg-white border border-line border-t-0 rounded-b-[20px] px-5 pt-3 pb-[18px] transition-colors duration-340 group-hover:border-muted/40 group-hover:border-t-0">
        {bottom}
      </div>
    </Tag>
  )
}

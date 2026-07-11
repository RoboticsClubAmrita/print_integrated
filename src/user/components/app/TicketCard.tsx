import type { ReactNode } from 'react'
import { clsx } from 'clsx'

/**
 * Boarding-pass card (ticket_card.dart): two sections separated by a
 * perforation strip with punched side notches. The notches are CSS-masked
 * out of the strip, so the card sits correctly on ANY background —
 * including gradients (an upgrade over the Flutter notchColor prop).
 * `ticket-strip` draws the hairline arc along each punched curve and
 * `ticket-lift` casts a mask-aware drop-shadow, so border and elevation
 * stay continuous around the cutouts, not just the straight edges.
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
        'group relative block w-full text-left rounded-card ticket-lift',
        interactive &&
          'press-soft transition-[transform,filter] duration-340 ease-out-quart hover:-translate-y-[2px] hover:ticket-lift-strong cursor-pointer',
        className,
      )}
    >
      <div className="bg-white border border-line border-b-0 rounded-t-card px-5 pt-[18px] pb-3">
        {top}
      </div>
      <div className="ticket-strip">
        <div aria-hidden className="ticket-notches absolute inset-0 bg-white border-x border-line" />
        <div aria-hidden className="absolute inset-y-0 inset-x-7 perforation" />
      </div>
      <div className="bg-white border border-line border-t-0 rounded-b-card px-5 pt-3 pb-[18px]">
        {bottom}
      </div>
    </Tag>
  )
}

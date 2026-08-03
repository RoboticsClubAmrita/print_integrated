import { ArrowRight } from 'lucide-react'
import { LocationPicker } from '@/components/app/LocationPicker'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui/Button'
import type { PrintLocation, PrintSide } from '@/types'
import { rateLabel } from '@/lib/pricing'

/**
 * Review column of the print console: location, quiet line items, then the
 * commitment block — the one dark surface on the page — carrying the animated
 * total and the primary CTA. On mobile the commit block hides; the fixed
 * bottom bar owns total + CTA there.
 */
export function SummaryPanel({
  locations,
  selectedLocationId,
  onLocationChange,
  pages,
  copies,
  side,
  estimate,
  disabled,
  loading,
  onSubmit,
}: {
  locations: PrintLocation[]
  selectedLocationId: string | null
  onLocationChange: (id: string) => void
  pages: number
  copies: number
  side: PrintSide
  estimate: number
  disabled: boolean
  loading: boolean
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div data-tour="tour-location">
        <LocationPicker
          locations={locations}
          selectedId={selectedLocationId}
          onChange={onLocationChange}
        />
      </div>

      <dl className="flex flex-col gap-2.5 text-[13.5px] font-medium">
        <div className="flex items-baseline justify-between">
          <dt className="text-muted">Pages × copies</dt>
          <dd className="font-bold tabular-nums text-ink">
            {pages || '—'} × {copies}
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-muted">Side</dt>
          <dd className="font-bold text-ink">{rateLabel(side)}</dd>
        </div>
      </dl>

      <div
        className="dark-panel relative hidden overflow-hidden rounded-[18px] p-5 lg:block"
        data-tour="tour-total"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots" />
        <div className="relative">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-semibold text-white/50">Estimated total</p>
            <p className="text-[11px] font-semibold text-white/35">incl. all charges</p>
          </div>
          <AnimatedNumber
            value={estimate}
            className="mt-1 block text-[36px] font-extrabold tracking-[-1px] text-white"
          />
          <Button
            variant="onDark"
            fullWidth
            trailingIcon={ArrowRight}
            disabled={disabled}
            loading={loading}
            onClick={onSubmit}
            className="mt-4"
            data-tour="tour-submit"
          >
            Place Print Order
          </Button>
        </div>
      </div>
    </div>
  )
}

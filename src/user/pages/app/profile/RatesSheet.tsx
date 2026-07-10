import { FlipHorizontal, FileText, Leaf } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { PRICE_TABLE } from '@/lib/pricing'
import { useDesktop } from '@/hooks/useMediaQuery'

/** Print Rates sheet (Profile → Print Rates): full 12-row size×type×side table. */
export function RatesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const desktop = useDesktop()

  return (
    <Sheet open={open} onClose={onClose} side={desktop ? 'right' : 'bottom'} title="Print Rates">
      <div className="flex flex-col gap-1">
        {PRICE_TABLE.map((row) => {
          const isDouble = row.side === 'double'
          const label = `${row.size} • ${row.type === 'colour' ? 'Colour' : 'B&W'} • ${
            isDouble ? 'Double-sided' : 'Single-sided'
          }`
          return (
            <div
              key={`${row.size}-${row.type}-${row.side}`}
              className="flex items-center gap-3 py-3 border-b border-line/60 last:border-0"
            >
              <span className="grid place-items-center size-9 rounded-[12px] bg-chip shrink-0">
                {isDouble ? (
                  <FlipHorizontal size={16} strokeWidth={1.8} />
                ) : (
                  <FileText size={16} strokeWidth={1.8} />
                )}
              </span>
              <span className="flex-1 text-[13.5px] font-semibold text-ink">{label}</span>
              <span className="text-[13.5px] font-extrabold text-ink shrink-0">
                ₹{row.price} / {isDouble ? 'sheet' : 'page'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-[16px] bg-chip px-4 py-3.5">
        <Leaf size={16} className="text-success shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[12.5px] font-medium text-muted leading-relaxed">
          Double-sided fits two pages per sheet — cheaper for long documents and better for the
          planet.
        </p>
      </div>
    </Sheet>
  )
}

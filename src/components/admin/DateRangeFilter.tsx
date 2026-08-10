import { CalendarRange, X } from 'lucide-react';
import { useDismissable } from './useDismissable';

/** `2026-08-08` → `8 Aug`. Bare ISO in, compact label out. */
const short = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function summarise(from: string, to: string): string {
    if (from && to) return `${short(from)} → ${short(to)}`;
    if (from) return `From ${short(from)}`;
    if (to) return `Until ${short(to)}`;
    return 'Any date';
}

/**
 * The date filter as one slot on the rail.
 *
 * Two naked `dd/mm/yyyy` fields are the widest thing in a filter bar and the
 * least-reached-for filter on the page — a poor trade for the third of the rail
 * they occupy. Collapsed to a trigger, the whole bar holds one row, and the
 * trigger says what the range actually is instead of showing empty scaffolding.
 */
export function DateRangeFilter({
    from,
    to,
    onFromChange,
    onToChange,
}: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
}) {
    const { ref, open, setOpen } = useDismissable();
    const active = Boolean(from || to);

    return (
        <div ref={ref} className="relative flex-none">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`filter-trigger ${active ? 'filter-trigger--on' : ''}`}
            >
                <CalendarRange size={14} className="shrink-0" />
                <span className="truncate">{summarise(from, to)}</span>
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Filter by date placed"
                    className="dialog absolute left-0 top-[calc(100%+8px)] z-30 w-[268px] origin-top-left !rounded-[16px] p-4"
                >
                    <p className="f-label">Date placed</p>
                    <div className="space-y-2.5">
                        <input
                            type="date"
                            value={from}
                            max={to || undefined}
                            onChange={(e) => onFromChange(e.target.value)}
                            className="ctl"
                            aria-label="From date"
                        />
                        <input
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(e) => onToChange(e.target.value)}
                            className="ctl"
                            aria-label="To date"
                        />
                    </div>
                    {active && (
                        <button
                            type="button"
                            onClick={() => {
                                onFromChange('');
                                onToChange('');
                            }}
                            className="btn-ghost mt-3 !h-9 w-full !text-[12.5px]"
                        >
                            <X size={13} /> Clear dates
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default DateRangeFilter;

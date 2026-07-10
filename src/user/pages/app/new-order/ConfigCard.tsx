import { useState } from 'react'
import { Calendar, Copy, Edit3 } from 'lucide-react'
import { PillToggle } from '@/components/ui/PillToggle'
import { FieldChip } from '@/components/ui/FieldChip'
import { StepperChip } from '@/components/ui/StepperChip'
import { PageRangeDialog } from '@/components/app/PageRangeDialog'
import { SchedulePicker } from '@/components/app/SchedulePicker'
import type { PrintSide } from '@/types'
import { formatDateTimeDot } from '@/lib/format'
import { formatPageRange } from '@/lib/pageRange'

/**
 * Order settings card (home_screen.dart's order form, minus upload — that's
 * FileDropZone): side toggle, page-range picker, copies stepper, print-time
 * picker. Order of controls is load-bearing, matching the original app.
 */
export function ConfigCard({
  side,
  onSideChange,
  totalPages,
  detecting,
  selectedPages,
  onPagesChange,
  copies,
  onCopiesChange,
  scheduledFor,
  onScheduleChange,
}: {
  side: PrintSide
  onSideChange: (side: PrintSide) => void
  totalPages: number | null
  detecting: boolean
  selectedPages: number[] | null
  onPagesChange: (pages: number[] | null) => void
  copies: number
  onCopiesChange: (copies: number) => void
  scheduledFor: Date | null
  onScheduleChange: (date: Date | null) => void
}) {
  const [pageRangeOpen, setPageRangeOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const pagesReady = !detecting && totalPages !== null
  const pagesValue = detecting
    ? 'Counting…'
    : totalPages === null
      ? '—'
      : selectedPages === null
        ? `All (${totalPages})`
        : `${selectedPages.length} of ${totalPages}`

  const summaryLine =
    totalPages === null
      ? null
      : selectedPages === null
        ? `Printing all ${totalPages} pages × ${copies} ${copies === 1 ? 'copy' : 'copies'}`
        : `Printing pages ${formatPageRange(selectedPages)} (${selectedPages.length} pages) × ${copies} ${copies === 1 ? 'copy' : 'copies'}`

  return (
    <div>
      <PillToggle
        options={[
          { value: 'SINGLE', label: 'Single-sided' },
          { value: 'DOUBLE', label: 'Double-sided' },
        ]}
        value={side}
        onChange={onSideChange}
      />

      <div className="mt-4">
        <FieldChip
          label="Pages"
          value={pagesValue}
          valueIsPlaceholder={!pagesReady}
          trailingIcon={Edit3}
          disabled={!pagesReady}
          onClick={() => setPageRangeOpen(true)}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StepperChip label="Copies" value={copies} min={1} onChange={onCopiesChange} />
        <FieldChip
          label="Print Time"
          value={scheduledFor ? formatDateTimeDot(scheduledFor.toISOString()) : 'Now'}
          trailingIcon={Calendar}
          onClick={() => setScheduleOpen(true)}
        />
      </div>

      {summaryLine && (
        <p className="mt-4 text-[13px] font-semibold text-muted flex items-center gap-1.5">
          <Copy size={13} strokeWidth={2} />
          {summaryLine}
        </p>
      )}

      {totalPages !== null && (
        <PageRangeDialog
          open={pageRangeOpen}
          totalPages={totalPages}
          initial={selectedPages}
          onApply={onPagesChange}
          onClose={() => setPageRangeOpen(false)}
        />
      )}
      <SchedulePicker
        open={scheduleOpen}
        value={scheduledFor}
        onChange={onScheduleChange}
        onClose={() => setScheduleOpen(false)}
        maxDaysAhead={30}
      />
    </div>
  )
}

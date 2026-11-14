import { useState } from 'react'
import { Calendar, Copy, Edit3 } from 'lucide-react'
import { PillToggle } from '@/components/ui/PillToggle'
import { FieldChip } from '@/components/ui/FieldChip'
import { StepperChip } from '@/components/ui/StepperChip'
import { PageRangeDialog } from '@/components/app/PageRangeDialog'
import { SchedulePicker } from '@/components/app/SchedulePicker'
import type { ColorMode, PaperSize, PrintSide } from '@/types'
import { PAPER_SIZES } from '@/lib/pricing'
import { formatDateTimeDot } from '@/lib/format'
import { formatPageRange } from '@/lib/pageRange'

/**
 * Order settings card (home_screen.dart's order form, minus upload — that's
 * FileDropZone): side, paper size and colour toggles, page-range picker,
 * copies stepper, print-time picker. Order of controls is load-bearing,
 * matching the mobile app.
 */
export function ConfigCard({
  side,
  onSideChange,
  pageType,
  onPageTypeChange,
  colorMode,
  onColorModeChange,
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
  pageType: PaperSize
  onPageTypeChange: (size: PaperSize) => void
  colorMode: ColorMode
  onColorModeChange: (mode: ColorMode) => void
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
      <div data-tour="tour-side">
        <PillToggle
          options={[
            { value: 'SINGLE', label: 'Single-sided' },
            { value: 'DOUBLE', label: 'Double-sided' },
          ]}
          value={side}
          onChange={onSideChange}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div data-tour="tour-size">
          <p className="mb-1.5 pl-1 text-[12px] font-semibold text-muted">Paper size</p>
          <PillToggle
            options={PAPER_SIZES.map((size) => ({ value: size, label: size }))}
            value={pageType}
            onChange={onPageTypeChange}
          />
        </div>
        <div data-tour="tour-colour">
          <p className="mb-1.5 pl-1 text-[12px] font-semibold text-muted">Print colour</p>
          <PillToggle
            options={[
              { value: 'BW', label: 'Black & White' },
              { value: 'COLOR', label: 'Colour' },
            ]}
            value={colorMode}
            onChange={onColorModeChange}
          />
        </div>
      </div>

      <div className="mt-4" data-tour="tour-pages">
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
        <div data-tour="tour-copies">
          <StepperChip label="Copies" value={copies} min={1} onChange={onCopiesChange} />
        </div>
        <div data-tour="tour-schedule">
          <FieldChip
            label="Print Time"
            value={scheduledFor ? formatDateTimeDot(scheduledFor.toISOString()) : 'Now'}
            trailingIcon={Calendar}
            onClick={() => setScheduleOpen(true)}
          />
        </div>
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

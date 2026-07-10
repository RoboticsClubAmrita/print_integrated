import { useState } from 'react'
import { Zap, CalendarClock } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { formatDateTimeDot } from '@/lib/format'

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * "When should we print?" sheet (home_screen.dart _pickSchedule): Print Now
 * vs Schedule for Later, the latter revealing date/time pickers capped at
 * maxDaysAhead, defaulting to now+1h.
 */
export function SchedulePicker({
  open,
  value,
  onChange,
  onClose,
  maxDaysAhead = 30,
}: {
  open: boolean
  value: Date | null
  onChange: (value: Date | null) => void
  onClose: () => void
  maxDaysAhead?: number
}) {
  const now = new Date()
  const defaultLater = new Date(now.getTime() + 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000)

  const [scheduling, setScheduling] = useState(!!value)
  const [dateStr, setDateStr] = useState(toDateInput(value ?? defaultLater))
  const [timeStr, setTimeStr] = useState(toTimeInput(value ?? defaultLater))

  const commitSchedule = (d: string, t: string) => {
    const [y, m, day] = d.split('-').map(Number)
    const [h, min] = t.split(':').map(Number)
    onChange(new Date(y, m - 1, day, h, min))
  }

  return (
    <Sheet open={open} onClose={onClose} title="When should we print?">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setScheduling(false)
            onChange(null)
            onClose()
          }}
          className="press-soft flex items-center gap-3 rounded-[20px] border-[1.6px] border-line px-4 py-4 text-left hover:border-ink/30 transition-colors"
        >
          <span className="grid place-items-center size-10 rounded-[14px] bg-chip shrink-0">
            <Zap size={18} strokeWidth={2} />
          </span>
          <span>
            <span className="block text-[15px] font-bold text-ink">Print Now</span>
            <span className="block text-[12.5px] font-medium text-muted">Joins the queue right away</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setScheduling(true)}
          className="press-soft flex items-center gap-3 rounded-[20px] border-[1.6px] border-line px-4 py-4 text-left hover:border-ink/30 transition-colors"
        >
          <span className="grid place-items-center size-10 rounded-[14px] bg-chip shrink-0">
            <CalendarClock size={18} strokeWidth={2} />
          </span>
          <span>
            <span className="block text-[15px] font-bold text-ink">Schedule for Later</span>
            <span className="block text-[12.5px] font-medium text-muted">
              Up to {maxDaysAhead} days ahead
            </span>
          </span>
        </button>

        {scheduling && (
          <div className="mt-1 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[12.5px] font-semibold text-muted mb-1.5 pl-1">Date</span>
              <input
                type="date"
                value={dateStr}
                min={toDateInput(now)}
                max={toDateInput(maxDate)}
                onChange={(e) => {
                  setDateStr(e.target.value)
                  commitSchedule(e.target.value, timeStr)
                }}
                className="w-full h-14 px-4 rounded-[22px] bg-chip text-[15px] font-bold text-ink outline-none border-[1.6px] border-transparent focus:border-ink focus:bg-white transition-colors"
              />
            </label>
            <label className="block">
              <span className="block text-[12.5px] font-semibold text-muted mb-1.5 pl-1">Time</span>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => {
                  setTimeStr(e.target.value)
                  commitSchedule(dateStr, e.target.value)
                }}
                className="w-full h-14 px-4 rounded-[22px] bg-chip text-[15px] font-bold text-ink outline-none border-[1.6px] border-transparent focus:border-ink focus:bg-white transition-colors"
              />
            </label>
            <Button
              size="md"
              fullWidth
              className="col-span-2 mt-1"
              onClick={() => {
                commitSchedule(dateStr, timeStr)
                onClose()
              }}
            >
              Set for {formatDateTimeDot(new Date(`${dateStr}T${timeStr}`).toISOString())}
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

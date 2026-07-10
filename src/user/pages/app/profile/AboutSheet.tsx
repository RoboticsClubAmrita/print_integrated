import { AppIcon } from '@/components/brand/AppIcon'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { resetDb } from '@/services/db'

/** About PrintEase sheet (Profile → About). */
export function AboutSheet({
  open,
  onClose,
  onViewDemo,
}: {
  open: boolean
  onClose: () => void
  onViewDemo: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center pt-2">
        <div className="dark-panel relative overflow-hidden rounded-[24px] size-16 grid place-items-center mb-4">
          <div aria-hidden className="absolute inset-0 bg-dots" />
          <AppIcon size={40} className="relative" />
        </div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-ink">PrintEase</h2>
        <p className="mt-2 text-[13.5px] font-medium text-muted leading-relaxed max-w-[320px]">
          Upload documents, customize print settings and collect your prints — without the queue.
        </p>

        <Button fullWidth className="mt-6" onClick={onViewDemo}>
          View Demo
        </Button>
        <button
          type="button"
          onClick={() => {
            resetDb()
            window.location.reload()
          }}
          className="mt-3 text-[13px] font-semibold text-muted hover:text-danger transition-colors"
        >
          Reset demo data
        </button>
        <p className="mt-6 text-[11.5px] font-medium text-muted/70">Version 1.0.0 (web demo)</p>
      </div>
    </Sheet>
  )
}

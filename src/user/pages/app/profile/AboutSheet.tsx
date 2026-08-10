import { PlayCircle } from 'lucide-react'
import { AppIcon } from '@/components/brand/AppIcon'
import { Sheet } from '@/components/ui/Sheet'
import { useAppStore } from '@/store/appStore'

/** About PrintEase sheet (Profile → About). */
export function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const replayTour = useAppStore((s) => s.replayTour)
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

        <button
          type="button"
          onClick={() => {
            onClose()
            replayTour()
          }}
          className="press mt-6 flex w-full items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-line py-3.5 text-[14px] font-bold text-ink transition-colors hover:bg-black/[0.03]"
        >
          <PlayCircle size={17} strokeWidth={2} />
          Replay walkthrough
        </button>
        <p className="mt-1.5 text-[11.5px] font-medium text-muted">
          Runs the guided tour again from the first step.
        </p>

        <p className="mt-6 text-[11.5px] font-medium text-muted/70">Version 1.0.0</p>
      </div>
    </Sheet>
  )
}

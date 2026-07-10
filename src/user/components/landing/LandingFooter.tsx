import { BrandMark } from '@/components/brand/BrandMark'

export function LandingFooter() {
  return (
    <footer className="dark-panel relative overflow-hidden rounded-none">
      <div aria-hidden className="absolute inset-0 bg-dots-lg pointer-events-none" />
      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6 py-16 sm:py-20 text-center">
        <div className="flex justify-center">
          <BrandMark onDark size={40} />
        </div>
        <p className="mt-4 text-[14px] font-medium text-white/50">
          Campus printing, minus the queue.
        </p>
        <p className="mt-10 text-[12.5px] font-semibold text-white/35">
          Built for Amrita · Static preview build, no account data leaves your browser
        </p>
      </div>
    </footer>
  )
}

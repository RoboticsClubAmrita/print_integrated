import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandMark'
import { useAppStore } from '@/store/appStore'

const PRODUCT_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
]

/**
 * The tear-off stub: the page ends the way a ticket does — a dashed tear
 * line, then the ink stub carrying the last call to action and the small
 * print. One dark surface, no card stack.
 */
export function LandingFooter() {
  const isLoggedIn = useAppStore((s) => !!s.user)

  return (
    <footer className="dark-panel relative overflow-hidden rounded-none border-x-0 border-b-0">
      <div aria-hidden className="absolute inset-0 bg-dots-lg pointer-events-none" />

      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        {/* closing CTA */}
        <div className="py-16 sm:py-20 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <h2 className="text-[30px] sm:text-[38px] font-extrabold tracking-[-0.8px] leading-tight text-white text-balance">
              Ready to skip the queue?
            </h2>
            <p className="mt-3 text-[15px] font-medium text-white/50 max-w-[440px] mx-auto lg:mx-0">
              Your next print job takes two minutes to send and zero minutes of standing in
              line.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-end">
            {isLoggedIn ? (
              <Link
                to="/app"
                className="press inline-flex items-center gap-2.5 h-14 px-7 rounded-[16px] bg-white text-ink font-bold text-[16px] hover:bg-white/90 transition-colors w-full sm:w-auto justify-center"
              >
                Open the app
                <ArrowRight size={18} strokeWidth={2.2} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="press inline-flex items-center gap-2.5 h-14 px-7 rounded-[16px] bg-white text-ink font-bold text-[16px] hover:bg-white/90 transition-colors w-full sm:w-auto justify-center"
                >
                  Start printing
                  <ArrowRight size={18} strokeWidth={2.2} />
                </Link>
                <Link
                  to="/login"
                  className="press-soft inline-flex items-center h-14 px-7 rounded-[16px] border-[1.5px] border-white/25 text-white font-bold text-[16px] hover:border-white/50 transition-colors w-full sm:w-auto justify-center"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* tear line */}
        <div aria-hidden className="border-t border-dashed border-white/15" />

        {/* the stub */}
        <div className="py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-6">
            <BrandMark onDark size={36} />
            <p className="mt-4 text-[14px] font-medium text-white/50 max-w-[300px]">
              Campus printing, minus the queue.
            </p>
            <p className="mt-6 font-receipt text-[11.5px] font-bold tracking-[1.5px] text-white/35">
              PRINTED ON CAMPUS · AMRITA VISHWA VIDYAPEETHAM
            </p>
          </div>

          <nav className="lg:col-span-3" aria-label="Product">
            <p className="text-[12.5px] font-bold text-white/40 mb-4">Product</p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[14px] font-semibold text-white/70 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-3" aria-label="Account">
            <p className="text-[12.5px] font-bold text-white/40 mb-4">Account</p>
            <ul className="space-y-3">
              {isLoggedIn ? (
                <li>
                  <Link
                    to="/app"
                    className="text-[14px] font-semibold text-white/70 hover:text-white transition-colors"
                  >
                    Open the app
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="text-[14px] font-semibold text-white/70 hover:text-white transition-colors"
                    >
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="text-[14px] font-semibold text-white/70 hover:text-white transition-colors"
                    >
                      Create account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        <div className="pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] font-semibold text-white/35">
          <span>© 2026 PrintEase</span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-success/80" />
            All stacks operating
          </span>
        </div>
      </div>
    </footer>
  )
}

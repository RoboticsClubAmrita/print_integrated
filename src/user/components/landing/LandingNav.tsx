import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandMark'
import { useAppStore } from '@/store/appStore'

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
]

export function LandingNav() {
  const isLoggedIn = useAppStore((s) => !!s.user)

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-[68px] flex items-center justify-between gap-3">
        <Link to="/" className="press-soft shrink-0">
          <BrandMark size={34} />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-semibold text-muted hover:text-ink transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {isLoggedIn ? (
          <Link
            to="/app"
            className="press inline-flex items-center h-11 px-5 rounded-[14px] bg-ink text-white text-[14px] font-bold hover:bg-ink-soft transition-colors"
          >
            Open App
          </Link>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="press-soft inline-flex items-center h-11 px-4 rounded-[14px] text-[14px] font-bold text-ink hover:bg-chip transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="press inline-flex items-center h-11 px-4 sm:px-5 rounded-[14px] bg-ink text-white text-[14px] font-bold hover:bg-ink-soft transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

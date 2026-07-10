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
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-[68px] flex items-center justify-between">
        <Link to="/" className="press-soft">
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

        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <Link
              to="/login"
              className="press-soft hidden sm:inline-flex items-center h-11 px-4 rounded-[14px] text-[14px] font-bold text-ink hover:bg-chip transition-colors"
            >
              Sign In
            </Link>
          )}
          <Link
            to={isLoggedIn ? '/app' : '/register'}
            className="press inline-flex items-center h-11 px-5 rounded-[14px] bg-ink text-white text-[14px] font-bold hover:bg-ink-soft transition-colors"
          >
            {isLoggedIn ? 'Open App' : 'Get Started'}
          </Link>
        </div>
      </div>
    </header>
  )
}

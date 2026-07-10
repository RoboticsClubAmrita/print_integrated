import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandMark'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <Link to="/" className="mb-10">
        <BrandMark />
      </Link>
      <div className="dark-panel relative overflow-hidden rounded-[28px] size-20 grid place-items-center mb-6">
        <div aria-hidden className="absolute inset-0 bg-dots" />
        <Compass size={32} className="relative text-white/80" strokeWidth={1.6} />
      </div>
      <h1 className="text-[42px] font-extrabold tracking-[-1px] text-ink">404</h1>
      <p className="mt-2 text-[15px] font-medium text-muted max-w-[320px]">
        This page took a wrong turn. Let&apos;s get you back on track.
      </p>
      <Link
        to="/"
        className="press mt-8 inline-flex items-center justify-center gap-2.5 rounded-[16px] font-bold tracking-[0.1px] bg-ink text-white hover:bg-ink-soft transition-colors duration-180 h-14 px-6 text-[16px]"
      >
        Back to home
      </Link>
    </div>
  )
}

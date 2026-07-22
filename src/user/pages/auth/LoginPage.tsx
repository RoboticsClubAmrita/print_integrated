import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, ArrowRight, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { login } from '@/services/authService'
import { loadPrefs } from '@/services/db'
import { MSG } from '@/lib/validators'
import { toast } from '@/store/uiStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { staggerParent, fadeSlideChild } from '@/lib/motion'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(() => loadPrefs().rememberedEmail ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => !!loadPrefs().rememberedEmail)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    const err = await login(email, password, remember)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    const from = (location.state as { from?: { pathname: string } } | null)?.from
    navigate(from?.pathname ?? '/app', { replace: true })
  }

  return (
    <AuthLayout>
      <motion.div variants={staggerParent(0.06)} initial="hidden" animate="visible">
        {/* Eyebrow */}
        <motion.div variants={fadeSlideChild}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[2.4px] text-muted">
            <span className="size-1.5 rounded-full bg-success" />
            Welcome back
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeSlideChild}
          className="mt-4 text-[31px] font-extrabold leading-[1.08] tracking-[-0.8px] text-ink"
        >
          Sign in to PrintEase
        </motion.h1>
        <motion.p variants={fadeSlideChild} className="mt-2 text-[14.5px] font-medium text-muted">
          Access your orders, billing and live print status.
        </motion.p>

        {/* Fields */}
        <motion.div variants={fadeSlideChild} className="mt-5 flex flex-col gap-3.5">
          <Field
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            onSubmit={submit}
          />
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-3 rounded-[12px] bg-danger/8 px-3 py-2 text-[13px] font-semibold text-danger"
          >
            {error}
          </motion.p>
        )}

        {/* Remember + forgot */}
        <motion.div variants={fadeSlideChild} className="mt-4 flex items-center justify-between">
          <label className="group flex cursor-pointer select-none items-center gap-2.5">
            <span
              className={clsx(
                'grid size-[18px] place-items-center rounded-[6px] border-[1.6px] transition-all duration-150',
                remember ? 'border-ink bg-ink' : 'border-line bg-white group-hover:border-muted',
              )}
            >
              {remember && <Check size={12} strokeWidth={3.5} className="text-white" />}
            </span>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="sr-only"
            />
            <span className="text-[13.5px] font-semibold text-ink">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-[13.5px] font-bold text-ink underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </motion.div>

        {/* Primary CTA */}
        <motion.div variants={fadeSlideChild}>
          <Button fullWidth className="mt-5" loading={busy} onClick={submit} trailingIcon={ArrowRight}>
            Sign In
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeSlideChild} className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[12px] font-semibold text-muted">or continue with</span>
          <div className="h-px flex-1 bg-line" />
        </motion.div>

        {/* Social */}
        <motion.div variants={fadeSlideChild} className="mt-3.5 grid grid-cols-2 gap-3">
          <SocialButton
            label="Google"
            glyph={<GoogleGlyph />}
            onClick={() => toast(MSG.socialUnavailable('Google'), undefined, 'warning')}
          />
          <SocialButton
            label="Apple"
            glyph={<AppleGlyph />}
            onClick={() => toast(MSG.socialUnavailable('Apple'), undefined, 'warning')}
          />
        </motion.div>

        {/* Sign up */}
        <motion.p
          variants={fadeSlideChild}
          className="mt-4 text-center text-[13.5px] font-medium text-muted"
        >
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-ink underline-offset-4 hover:underline">
            Create one
          </Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  )
}

/** Outline social button with a brand glyph slot. */
function SocialButton({
  label,
  glyph,
  onClick,
}: {
  label: string
  glyph: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex h-12 items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-white text-[14.5px] font-bold text-ink transition-colors hover:border-muted/50 hover:bg-chip/50"
    >
      {glyph}
      {label}
    </button>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 12.54c-.03-2.53 2.07-3.75 2.16-3.81-1.18-1.72-3.01-1.96-3.66-1.99-1.56-.16-3.04.92-3.83.92-.79 0-2.01-.9-3.31-.87-1.7.03-3.27.99-4.14 2.51-1.77 3.07-.45 7.61 1.27 10.1.84 1.22 1.84 2.59 3.15 2.54 1.26-.05 1.74-.82 3.27-.82 1.52 0 1.95.82 3.28.79 1.36-.02 2.22-1.24 3.05-2.47.96-1.42 1.36-2.79 1.38-2.86-.03-.01-2.65-1.02-2.68-4.03-.01-.01.01 0 0 0ZM14.6 4.98c.7-.85 1.17-2.03 1.04-3.2-1 .04-2.22.67-2.94 1.51-.64.75-1.21 1.95-1.06 3.1 1.12.09 2.26-.57 2.96-1.41Z" />
    </svg>
  )
}

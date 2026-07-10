import { useState } from 'react'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { forgotPassword } from '@/services/authService'
import { fadeIn } from '@/lib/motion'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function ForgotPasswordPage() {
  useDocumentTitle('Reset password')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    const err = await forgotPassword(email)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="press-soft mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="form" variants={fadeIn} initial="hidden" animate="visible" exit="exit">
            <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-ink">
              Reset Password
            </h1>
            <p className="mt-2 text-[14px] font-medium text-muted leading-relaxed">
              Enter the email linked to your account and we will send you a reset link.
            </p>
            <div className="mt-6">
              <Field
                label="Email"
                type="email"
                icon={Mail}
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                onSubmit={submit}
                autoComplete="email"
              />
            </div>
            {error && (
              <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
                {error}
              </p>
            )}
            <Button fullWidth className="mt-6" loading={busy} onClick={submit}>
              Send Reset Link
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center"
          >
            <div className="mx-auto grid place-items-center size-14 rounded-full bg-chip mb-5">
              <MailCheck size={24} className="text-ink" strokeWidth={1.8} />
            </div>
            <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-ink">
              Check your inbox
            </h1>
            <p className="mt-2 text-[14px] font-medium text-muted">
              A reset link was sent to {email}.
            </p>
            <Button fullWidth className="mt-7" onClick={() => navigate('/login')}>
              Back to Sign In
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!sent && (
        <p className="mt-8 text-center text-[13.5px] font-medium text-muted">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-ink hover:underline">
            Sign In
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}

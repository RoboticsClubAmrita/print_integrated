import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { OtpDemoHint } from '@/components/app/OtpDemoHint'
import { login, resendVerification, verifyEmail } from '@/services/authService'
import { showSuccess, toast } from '@/store/uiStore'
import { useCountdown } from '@/hooks/useCountdown'
import { formatCountdown } from '@/lib/format'
import { MSG } from '@/lib/validators'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface RegisterState {
  email: string
  password: string
  code?: string
}

export default function VerifyEmailPage() {
  useDocumentTitle('Verify your email')
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RegisterState | null

  useEffect(() => {
    if (!state?.email) navigate('/register', { replace: true })
  }, [state, navigate])

  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState(state?.code ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { remaining, done, restart } = useCountdown(30)

  if (!state?.email) return null

  const verify = async (otp: string) => {
    setBusy(true)
    setError(null)
    const err = await verifyEmail(state.email, otp)
    if (err) {
      setBusy(false)
      setError(err)
      return
    }
    showSuccess({ title: 'Email verified', subtitle: 'Welcome to PrintEase!', icon: 'mail' })
    const loginErr = await login(state.email, state.password, true)
    setBusy(false)
    if (!loginErr) navigate('/app', { replace: true })
  }

  const resend = async () => {
    const r = await resendVerification(state.email)
    setDemoCode(r.code)
    restart()
    toast(MSG.otpResent)
  }

  return (
    <AuthLayout>
      <button
        type="button"
        onClick={() => navigate('/register')}
        className="press-soft mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="text-center">
        <h1 className="text-[24px] font-extrabold tracking-[-0.4px] text-ink">
          Verify your email
        </h1>
        <p className="mt-2 text-[13.5px] font-medium text-muted leading-relaxed">
          Enter the 4-digit code sent to {state.email}.
          <br />
          Wrong address? Go back to change it.
        </p>
      </div>

      <div className="mt-8">
        <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} error={!!error} />
        {error ? (
          <p role="alert" className="mt-3 text-center text-[12.5px] font-semibold text-danger">
            {error}
          </p>
        ) : demoCode ? (
          <div className="mt-3 flex justify-center">
            <OtpDemoHint code={demoCode} />
          </div>
        ) : null}
      </div>

      <Button fullWidth className="mt-6" loading={busy} disabled={code.length < 4} onClick={() => verify(code)}>
        Verify email
      </Button>

      <div className="mt-4 text-center text-[13px] font-semibold text-muted">
        {done ? (
          <button type="button" onClick={resend} className="font-bold text-ink hover:underline">
            Resend OTP
          </button>
        ) : (
          <>Didn&apos;t get it? Resend in {formatCountdown(remaining)}</>
        )}
      </div>
    </AuthLayout>
  )
}

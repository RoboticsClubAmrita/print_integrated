import { useEffect, useState } from 'react'
import { ArrowLeft, MailX } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { resendVerification, verifyEmail } from '@/services/authService'
import { showSuccess, toast } from '@/store/uiStore'
import { useCountdown } from '@/hooks/useCountdown'
import { formatCountdown } from '@/lib/format'
import { MSG } from '@/lib/validators'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useDeliveryStatus } from '@/hooks/useDeliveryStatus'

interface RegisterState {
  collegeId: string
  email?: string
  /** The form as submitted, so "Back to sign up" can refill it. */
  signup?: Record<string, string>
}

/** Must match the backend's /auth/register/resend cooldown, or an early resend is refused. */
const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
  useDocumentTitle('Verify your email')
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RegisterState | null

  useEffect(() => {
    if (!state?.collegeId) navigate('/register', { replace: true })
  }, [state, navigate])

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { remaining, done, restart } = useCountdown(RESEND_COOLDOWN_SECONDS)
  const [sends, setSends] = useState(0)
  const delivery = useDeliveryStatus(state?.email, sends)

  if (!state?.collegeId) return null

  const backToSignup = () => navigate('/register', { state: state.signup })

  const verify = async (otp: string) => {
    setBusy(true)
    setError(null)
    const err = await verifyEmail(state.collegeId, otp)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    showSuccess({ title: 'Email verified', subtitle: 'Welcome to PrintEase!', icon: 'mail' })
    navigate('/app', { replace: true })
  }

  const resend = async () => {
    const err = await resendVerification(state.collegeId)
    restart()
    if (!err) setSends((n) => n + 1)
    if (err) {
      toast(err, undefined, 'warning')
    } else {
      toast(MSG.otpResent)
    }
  }

  return (
    <AuthLayout>
      <button
        type="button"
        onClick={backToSignup}
        className="press-soft mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {delivery === 'BOUNCED' ? (
        <div role="alert" className="text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-danger/10">
            <MailX size={22} className="text-danger" strokeWidth={2} />
          </div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-ink">
            This email address doesn&apos;t exist
          </h1>
          <p className="mt-2 text-[13.5px] font-medium text-muted leading-relaxed">
            The code to <span className="font-bold text-ink">{state.email}</span> came back
            undelivered. Check your roll number / email.
          </p>
          <Button fullWidth className="mt-6" onClick={backToSignup}>
            Back to sign up
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h1 className="text-[24px] font-extrabold tracking-[-0.4px] text-ink">
              Verify your email
            </h1>
            <p className="mt-2 text-[13.5px] font-medium text-muted leading-relaxed">
              Enter the 4-digit code sent to {state.email ?? 'your Amrita email'}.
              <br />
              Wrong roll number or email? Go back to change it.
            </p>
          </div>

          <div className="mt-8">
            <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} error={!!error} />
            {error && (
              <p role="alert" className="mt-3 text-center text-[12.5px] font-semibold text-danger">
                {error}
              </p>
            )}
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
        </>
      )}
    </AuthLayout>
  )
}

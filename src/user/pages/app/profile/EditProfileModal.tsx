import { useState } from 'react'
import { Mail, Phone, User as UserIcon } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { filterPhoneInput, isAmritaEmail, isValidPhone, MSG } from '@/lib/validators'
import { requestEmailChange, updateProfile, verifyEmailChange } from '@/services/authService'
import { showSuccess } from '@/store/uiStore'
import type { User } from '@/types'

type Step = 'form' | 'otp'

/**
 * Edit Profile (edit_profile_screen.dart): name/phone save directly; an
 * email change is gated by a 4-digit OTP before the profile update commits.
 */
export function EditProfileModal({
  open,
  user,
  onClose,
}: {
  open: boolean
  user: User
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)

  const reset = () => {
    setStep('form')
    setName(user.name)
    setEmail(user.email)
    setPhone(user.phone)
    setError(null)
    setOtp('')
    setOtpError(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const finishSave = async () => {
    const err = await updateProfile(name, phone)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    close()
    showSuccess({ title: 'Profile Updated', subtitle: 'Changes saved successfully.' })
  }

  const save = async () => {
    if (!name.trim()) return setError(MSG.enterFullName)
    if (!isAmritaEmail(email)) return setError(MSG.useAmritaEmail)
    if (!isValidPhone(phone)) return setError(MSG.invalidPhone)

    setBusy(true)
    setError(null)

    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const result = await requestEmailChange(email)
      setBusy(false)
      if (result.error) {
        setError(result.error)
        return
      }
      setStep('otp')
      return
    }

    await finishSave()
  }

  const verify = async (code: string) => {
    setBusy(true)
    setOtpError(null)
    const err = await verifyEmailChange(code)
    if (err) {
      setBusy(false)
      setOtpError(err)
      return
    }
    await finishSave()
  }

  return (
    <Modal open={open} onClose={close} title={step === 'form' ? 'Edit Profile' : 'Verify new email'}>
      {step === 'form' ? (
        <div className="flex flex-col gap-4">
          <Field label="Full Name" icon={UserIcon} value={name} onChange={setName} />
          <Field
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            hint="Changing your email will require OTP verification."
          />
          <Field
            label="Phone Number"
            type="tel"
            icon={Phone}
            value={phone}
            onChange={setPhone}
            transform={filterPhoneInput}
          />
          {error && (
            <p role="alert" className="text-[13px] font-semibold text-danger">
              {error}
            </p>
          )}
          <Button fullWidth loading={busy} onClick={save}>
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <p className="text-center text-[13.5px] font-medium text-muted">
            Enter the 4-digit code sent to {email}.
          </p>
          <OtpInput value={otp} onChange={setOtp} onComplete={verify} disabled={busy} error={!!otpError} />
          {otpError && (
            <p role="alert" className="text-[12.5px] font-semibold text-danger">
              {otpError}
            </p>
          )}
          <Button fullWidth loading={busy} disabled={otp.length < 4} onClick={() => verify(otp)}>
            Verify &amp; Save
          </Button>
        </div>
      )}
    </Modal>
  )
}

import { useState } from 'react'
import { ArrowLeft, IdCard, Mail, Phone, User as UserIcon, Lock } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { register, staffEmailIssue, type SignupRole } from '@/services/authService'
import { filterPhoneInput, isValidPhone, MSG, passwordIssue } from '@/lib/validators'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  // Pre-filled when the code screen sends the user back to fix a bounced address.
  const prefill = (useLocation().state ?? {}) as Partial<{
    role: SignupRole
    name: string
    collegeId: string
    phone: string
    email: string
  }>

  const [role, setRole] = useState<SignupRole>(prefill.role ?? 'STUDENT')
  const [name, setName] = useState(prefill.name ?? '')
  const [collegeId, setCollegeId] = useState(prefill.collegeId ?? '')
  const [staffEmail, setStaffEmail] = useState(prefill.email ?? '')
  const [phone, setPhone] = useState(prefill.phone ?? '')
  const [password, setPassword] = useState('')
  const isStaff = role === 'FACULTY'
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const validate = (): string | null => {
    if (!name.trim()) return MSG.enterFullName
    if (!collegeId.trim()) return MSG.enterCollegeId(isStaff ? 'Staff ID' : 'Roll Number')
    if (isStaff) {
      const emailIssue = staffEmailIssue(staffEmail)
      if (emailIssue) return emailIssue
    }
    if (!isValidPhone(phone)) return MSG.invalidPhone
    return passwordIssue(password)
  }

  const submit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setBusy(true)
    setError(null)
    const result = await register({
      name,
      collegeId,
      phone,
      password,
      role,
      ...(isStaff ? { email: staffEmail } : {}),
    })
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/verify-email', {
      state: {
        collegeId: collegeId.trim().toUpperCase(),
        email: result.email,
        // Carried so "Back to sign up" can refill the form after a bounce.
        signup: { role, name, collegeId, phone, email: isStaff ? staffEmail : '' },
      },
    })
  }

  return (
    <AuthLayout>
      <Link
        to="/login"
        className="press-soft mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="text-[28px] font-extrabold tracking-[-0.5px] text-ink">Create Account</h1>
      <p className="mt-2 text-[14.5px] font-medium text-muted">
        {isStaff
          ? 'Join with your staff ID and your Amrita staff email.'
          : 'Join with your roll number — your Amrita email is set up automatically.'}
      </p>

      <div
        role="tablist"
        aria-label="I am signing up as"
        className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-chip p-1"
      >
        {(
          [
            { key: 'STUDENT', label: 'Student' },
            { key: 'FACULTY', label: 'Staff' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={role === opt.key}
            onClick={() => {
              setRole(opt.key)
              setError(null)
            }}
            className={clsx(
              'press rounded-full py-2.5 text-[13.5px] font-bold transition-colors duration-180',
              role === opt.key ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Field
          label="Full Name"
          icon={UserIcon}
          placeholder="Deepa Mohan"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          label={isStaff ? 'Staff ID' : 'Roll Number'}
          icon={IdCard}
          placeholder={isStaff ? 'Your staff ID' : 'CB.SC.U4XXXXXX'}
          value={collegeId}
          onChange={setCollegeId}
          transform={(v) => v.toUpperCase()}
        />
        {isStaff && (
          <Field
            label="Amrita Email"
            type="email"
            icon={Mail}
            placeholder="name@cb.amrita.edu"
            value={staffEmail}
            onChange={setStaffEmail}
            autoComplete="email"
          />
        )}
        <Field
          label="Phone Number"
          type="tel"
          icon={Phone}
          placeholder="10-digit number"
          value={phone}
          onChange={setPhone}
          transform={filterPhoneInput}
          autoComplete="tel"
        />
        <Field
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Minimum 4 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          onSubmit={submit}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}

      <Button fullWidth className="mt-6" loading={busy} onClick={submit}>
        Create Account
      </Button>

      <p className="mt-8 text-center text-[13.5px] font-medium text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-ink hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}

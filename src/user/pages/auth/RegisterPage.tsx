import { useState } from 'react'
import { ArrowLeft, IdCard, Mail, Phone, User as UserIcon, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { PillToggle } from '@/components/ui/PillToggle'
import { register } from '@/services/authService'
import {
  filterPhoneInput,
  isAmritaEmail,
  isValidPhone,
  MSG,
  passwordIssue,
} from '@/lib/validators'
import type { Role } from '@/types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('STUDENT')
  const [name, setName] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const idLabel = role === 'STUDENT' ? 'Roll Number' : 'College ID'
  const idHint = role === 'STUDENT' ? 'CB.SC.U4XXXXXX' : 'Staff ID'

  const validate = (): string | null => {
    if (!name.trim()) return MSG.enterFullName
    if (!collegeId.trim()) return MSG.enterCollegeId(idLabel)
    if (!isAmritaEmail(email)) return MSG.useAmritaEmail
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
    const result = await register({ name, email, password, collegeId, phone, role })
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/verify-email', { state: { email: email.trim(), password, code: result.code } })
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
        Join with your Amrita campus email.
      </p>

      <div className="mt-6">
        <span className="block text-[12.5px] font-semibold text-muted mb-1.5 pl-1">I am a</span>
        <PillToggle
          options={[
            { value: 'STUDENT', label: 'Student' },
            { value: 'FACULTY', label: 'Faculty' },
          ]}
          value={role}
          onChange={setRole}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Field
          label="Full Name"
          icon={UserIcon}
          placeholder="Deepa Mohan"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          label={idLabel}
          icon={IdCard}
          placeholder={idHint}
          value={collegeId}
          onChange={setCollegeId}
          transform={(v) => v.toUpperCase()}
        />
        <Field
          label="Amrita Email"
          type="email"
          icon={Mail}
          placeholder="you@amrita.edu"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
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

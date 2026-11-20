/**
 * Auth flows — all real, against the same backend the admin console uses
 * (`src/services/api.js`), so both interfaces share one login/session.
 * Signup is pending-until-verified: `/auth/register/start` emails an OTP to
 * the school-derived address, `/auth/register/verify` creates the account
 * and logs the user straight in.
 */
import { MSG } from '@/lib/validators'
import { savePrefs } from '@/services/db'
import { useAppStore } from '@/store/appStore'
import {
  authService as realAuth,
  userService as realUsers,
} from '../../services/api'
import { setPersistence } from '../../services/tokenStore'

const INVALID_OTP = 'Invalid code. Try again.'

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { MESSAGE?: string; message?: string } } }
  return e?.response?.data?.MESSAGE || e?.response?.data?.message || fallback
}

export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<string | null> {
  if (!email.trim() || !password) return MSG.loginEmpty
  // Decide where the session will live *before* the call that writes it:
  // realAuth.login persists the token as soon as it returns.
  setPersistence(remember)
  try {
    const data = await realAuth.login({ email, password, rememberMe: remember })
    const token = data?.accessToken || data?.token
    if (!token || !data?.user) return 'Incorrect college ID or password.'
    const session = {
      userId: data.user._id,
      token,
      rememberMe: remember,
      createdAt: new Date().toISOString(),
    }
    savePrefs({ rememberedEmail: remember ? email.trim() : null })
    useAppStore.getState().setSession(session)
    return null
  } catch (err) {
    return apiErrorMessage(err, 'Incorrect college ID or password.')
  }
}

export interface RegistrationDraft {
  name: string
  collegeId: string
  phone: string
  password: string
}

export type SignupRole = 'STUDENT' | 'FACULTY'

/** Mirrors the backend's staffEmailIssue (authModule.js) so the form says the same thing first. */
export function staffEmailIssue(rawEmail: string): string | null {
  const email = rawEmail.trim().toLowerCase()
  if (!email) return 'Amrita email is required for staff'
  const at = email.lastIndexOf('@')
  if (at <= 0 || at === email.length - 1) return 'Enter a valid email address'
  const domain = email.slice(at + 1)
  if (domain !== 'amrita.edu' && !domain.endsWith('.amrita.edu')) {
    return 'Use your Amrita staff email (…@amrita.edu)'
  }
  if (domain === 'students.amrita.edu' || domain.endsWith('.students.amrita.edu')) {
    return 'That is a student email. Students should sign up with their roll number.'
  }
  return null
}

/**
 * Starts pending-until-verified signup. A student's email is derived from the
 * roll number by the backend; staff (role FACULTY) give their own.
 * Returns the address the code was sent to.
 */
export async function register(
  draft: RegistrationDraft & { role?: SignupRole; email?: string },
): Promise<{ error: string | null; email?: string }> {
  const { name, collegeId, phone, password, role = 'STUDENT', email } = draft
  if (!name.trim() || !collegeId.trim() || !phone.trim() || !password) {
    return { error: MSG.registerEmpty }
  }
  try {
    const data = await realAuth.registerStart({
      collegeId: collegeId.trim(),
      name: name.trim(),
      phone: phone.trim(),
      password,
      role,
      ...(role === 'FACULTY' && email ? { email: email.trim() } : {}),
    })
    return { error: null, email: data?.email }
  } catch (err) {
    return { error: apiErrorMessage(err, 'Could not start registration.') }
  }
}

export async function resendVerification(collegeId: string): Promise<string | null> {
  try {
    await realAuth.registerResend({ collegeId })
    return null
  } catch (err) {
    return apiErrorMessage(err, 'Could not resend the code.')
  }
}

/** Verifies the signup OTP; on success the backend creates the account and logs the user in. */
export async function verifyEmail(collegeId: string, otp: string): Promise<string | null> {
  setPersistence(true) // signup has no checkbox; a new account stays signed in
  try {
    const data = await realAuth.registerVerify({ collegeId, otp })
    const token = data?.accessToken || data?.token
    if (!token || !data?.user) return INVALID_OTP
    const session = {
      userId: data.user._id,
      token,
      rememberMe: true,
      createdAt: new Date().toISOString(),
    }
    useAppStore.getState().setSession(session)
    return null
  } catch (err) {
    return apiErrorMessage(err, INVALID_OTP)
  }
}

export async function forgotPassword(email: string): Promise<string | null> {
  if (!email.trim()) return MSG.enterEmail
  try {
    await realAuth.forgotPassword(email.trim())
    return null
  } catch (err) {
    return apiErrorMessage(err, 'No account found with that email.')
  }
}

export function logout(): void {
  // Best-effort remote revoke; api.js clears localStorage.token/user itself
  // (in its `finally`) regardless of whether the network call succeeds.
  realAuth.logout().catch(() => {})
  useAppStore.getState().clear()
}

/** Re-fetches the current user from the backend and syncs localStorage + the store. */
async function refetchUser(userId: string): Promise<void> {
  const res = await realUsers.getById(userId)
  const raw = res?.DATA ?? res
  if (!raw?._id) return
  localStorage.setItem('user', JSON.stringify(raw))
  useAppStore.getState().setUser({
    id: raw._id,
    collegeId: raw.collegeId ?? '',
    name: raw.name ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    password: '',
    role: raw.role,
    balance: raw.balance ?? 0,
  })
}

export async function updateProfile(name: string, phone: string): Promise<string | null> {
  const state = useAppStore.getState()
  if (!state.user) return MSG.network
  try {
    await realUsers.edit({ userId: state.user.id, name: name.trim(), phone: phone.trim() })
    await refetchUser(state.user.id)
    return null
  } catch (err) {
    return apiErrorMessage(err, MSG.network)
  }
}

export async function requestEmailChange(
  newEmail: string,
): Promise<{ error: string | null }> {
  const userId = useAppStore.getState().user?.id
  if (!userId) return { error: MSG.network }
  try {
    await realUsers.requestEmailChange({ userId, newEmail: newEmail.trim() })
    return { error: null }
  } catch (err) {
    return { error: apiErrorMessage(err, 'Could not start the email change.') }
  }
}

export async function verifyEmailChange(otp: string): Promise<string | null> {
  const userId = useAppStore.getState().user?.id
  if (!userId) return MSG.network
  try {
    await realUsers.verifyEmailChange({ userId, otp })
    await refetchUser(userId)
    return null
  } catch (err) {
    return apiErrorMessage(err, INVALID_OTP)
  }
}

export type DeliveryStatus = 'SENT' | 'BOUNCED' | 'UNKNOWN'

/** Whether the sign-up code email has come back "mailbox doesn't exist". */
export async function getRegistrationStatus(email: string): Promise<DeliveryStatus> {
  const data = await realAuth.registerStatus(email)
  const status = data?.deliveryStatus
  return status === 'SENT' || status === 'BOUNCED' ? status : 'UNKNOWN'
}

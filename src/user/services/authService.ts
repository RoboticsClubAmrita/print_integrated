/**
 * Auth flows. `login`/`logout`/`forgotPassword` call the REAL backend (the
 * same `services/api.js` the admin console uses) so both interfaces share
 * one login. Registration/email-verify stay mocked against the local db —
 * out of scope for the User/Admin merge, see the merge plan.
 */
import type { Role } from '@/types'
import { MSG } from '@/lib/validators'
import { delay } from '@/lib/delay'
import { getDb, saveDb, savePrefs, uid } from '@/services/db'
import { requestOtp, verifyOtp } from '@/services/otpService'
import { useAppStore } from '@/store/appStore'
import { authService as realAuth } from '../../services/api'

const INVALID_OTP = 'Invalid code. Try again.'

function findUserByEmail(email: string) {
  return getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
}

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
  try {
    const data = await realAuth.login({ email, password })
    if (!data?.token || !data?.user) return 'Incorrect email or password.'
    const session = {
      userId: data.user._id,
      token: data.token,
      rememberMe: remember,
      createdAt: new Date().toISOString(),
    }
    savePrefs({ rememberedEmail: remember ? email.trim() : null })
    useAppStore.getState().setSession(session)
    return null
  } catch (err) {
    return apiErrorMessage(err, 'Incorrect email or password.')
  }
}

export interface RegistrationDraft {
  name: string
  email: string
  password: string
  collegeId: string
  phone: string
  role: Role
}

let pendingRegistration: RegistrationDraft | null = null

/** Validates + parks the draft, then issues the email-verification OTP. */
export async function register(
  draft: RegistrationDraft,
): Promise<{ error: string | null; code?: string }> {
  const { name, email, password, collegeId, phone } = draft
  if (!name.trim() || !email.trim() || !password || !collegeId.trim() || !phone.trim()) {
    return { error: MSG.registerEmpty }
  }
  await delay()
  if (findUserByEmail(email)) {
    return { error: 'An account with this email already exists.' }
  }
  pendingRegistration = { ...draft, collegeId: collegeId.trim().toUpperCase() }
  return { error: null, code: requestOtp('email-verify', email) }
}

export async function resendVerification(email: string): Promise<{ code: string }> {
  await delay()
  return { code: requestOtp('email-verify', email) }
}

/** Verifies the signup OTP and commits the pending account. */
export async function verifyEmail(email: string, otp: string): Promise<string | null> {
  await delay()
  if (!verifyOtp('email-verify', email, otp)) return INVALID_OTP
  if (pendingRegistration && pendingRegistration.email.toLowerCase() === email.toLowerCase()) {
    const db = getDb()
    db.users.push({
      id: uid('u'),
      collegeId: pendingRegistration.collegeId,
      name: pendingRegistration.name.trim(),
      email: pendingRegistration.email.trim(),
      phone: pendingRegistration.phone.trim(),
      password: pendingRegistration.password,
      role: pendingRegistration.role,
      balance: 0,
    })
    saveDb()
    pendingRegistration = null
  }
  return null
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
  // Stateless JWT — the server call is best-effort; clear the local session
  // immediately regardless of network state rather than waiting on it (and
  // api.js only clears localStorage.token/user *after* that call resolves).
  realAuth.logout().catch(() => {})
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  useAppStore.getState().clear()
}

export async function updateProfile(name: string, phone: string): Promise<string | null> {
  await delay()
  const state = useAppStore.getState()
  if (!state.user) return MSG.network
  const db = getDb()
  const user = db.users.find((u) => u.id === state.user!.id)
  if (!user) return MSG.network
  user.name = name.trim()
  user.phone = phone.trim()
  saveDb()
  state.refresh()
  return null
}

export async function requestEmailChange(
  newEmail: string,
): Promise<{ error: string | null; code?: string }> {
  await delay()
  const userId = useAppStore.getState().user?.id
  if (!userId) return { error: MSG.network }
  if (findUserByEmail(newEmail)) return { error: 'That email is already in use.' }
  return { error: null, code: requestOtp('email-change', userId) }
}

export async function verifyEmailChange(otp: string, newEmail: string): Promise<string | null> {
  await delay()
  const state = useAppStore.getState()
  const userId = state.user?.id
  if (!userId) return MSG.network
  if (!verifyOtp('email-change', userId, otp)) return INVALID_OTP
  const db = getDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return MSG.network
  user.email = newEmail.trim()
  saveDb()
  state.refresh()
  return null
}

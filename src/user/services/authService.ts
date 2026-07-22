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
  try {
    const data = await realAuth.login({ email, password })
    const token = data?.accessToken || data?.token
    if (!token || !data?.user) return 'Incorrect email or password.'
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
    return apiErrorMessage(err, 'Incorrect email or password.')
  }
}

export interface RegistrationDraft {
  name: string
  collegeId: string
  phone: string
  password: string
}

/** Starts pending-until-verified signup. Returns the school-derived email on success. */
export async function register(
  draft: RegistrationDraft,
): Promise<{ error: string | null; email?: string }> {
  const { name, collegeId, phone, password } = draft
  if (!name.trim() || !collegeId.trim() || !phone.trim() || !password) {
    return { error: MSG.registerEmpty }
  }
  try {
    const data = await realAuth.registerStart({ collegeId: collegeId.trim(), name: name.trim(), phone: phone.trim(), password })
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

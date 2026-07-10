/**
 * Verbatim port of the Flutter app's validators (lib/utils/validators.dart)
 * plus the exact form-level error strings used across screens.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/** Amrita institutional email: `amrita.edu` or any `*.amrita.edu` subdomain. */
export function isAmritaEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized)) return false
  const domain = normalized.split('@').pop() ?? ''
  return domain === 'amrita.edu' || domain.endsWith('.amrita.edu')
}

/** Returns an error string, or null when the password is acceptable. */
export function passwordIssue(password: string): string | null {
  if (password.length < 4) return 'Password must be at least 4 characters'
  return null
}

/** Valid when 10–15 digits remain after stripping non-digits. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

/** Keep only the characters the app's phone inputs accept: [0-9+ ]. */
export function filterPhoneInput(value: string): string {
  return value.replace(/[^0-9+ ]/g, '')
}

/** Exact user-facing message strings (do not reword). */
export const MSG = {
  loginEmpty: 'Enter your email and password',
  registerEmpty: 'Fill in all fields to register',
  enterFullName: 'Enter your full name',
  enterCollegeId: (label: string) => `Enter your ${label}`,
  useAmritaEmail: 'Use your Amrita email (@amrita.edu)',
  invalidPhone: 'Enter a valid phone number',
  enterEmail: 'Enter your email address',
  network: 'Could not reach the server. Check your connection.',
  socialUnavailable: (provider: string) =>
    `${provider} sign-in is not available yet — use email and password.`,
  otpResent: 'A new code is on its way.',
} as const

/**
 * Mock OTP service. Codes live in memory only; every OTP UI surfaces the
 * active code through a demo-hint chip. Verification consumes the code.
 */

export type OtpPurpose = 'email-verify' | 'email-change' | 'collect'

const codes = new Map<string, string>()

function key(purpose: OtpPurpose, target: string): string {
  return `${purpose}:${target.toLowerCase()}`
}

/** Generates (or regenerates, on resend) a 4-digit code and returns it. */
export function requestOtp(purpose: OtpPurpose, target: string): string {
  const code = String(Math.floor(1000 + Math.random() * 9000))
  codes.set(key(purpose, target), code)
  return code
}

/** Verifies and consumes the code. */
export function verifyOtp(purpose: OtpPurpose, target: string, code: string): boolean {
  const k = key(purpose, target)
  if (codes.get(k) !== code) return false
  codes.delete(k)
  return true
}

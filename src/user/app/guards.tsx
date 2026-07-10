import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

/** Blocks unauthenticated access, preserving the attempted path for return-after-login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isLoggedIn = useAppStore((s) => !!s.user)
  const location = useLocation()
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

/** Keeps signed-in users off the auth pages (login/register/forgot-password). */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const isLoggedIn = useAppStore((s) => !!s.user)
  if (isLoggedIn) return <Navigate to="/app" replace />
  return <>{children}</>
}

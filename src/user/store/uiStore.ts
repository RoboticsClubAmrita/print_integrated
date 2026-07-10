/** UI-only state: toasts, the success overlay, and the mock checkout request. */
import { create } from 'zustand'

export type ToastTone = 'info' | 'success' | 'warning'

export interface Toast {
  id: string
  title: string
  body?: string
  tone: ToastTone
}

export type SuccessIcon = 'check' | 'mail' | 'package'

export interface SuccessData {
  title: string
  subtitle?: string
  icon?: SuccessIcon
}

export interface CheckoutRequest {
  title: string
  description: string
  amount: number
  /** "Paying 2 of 3" during the sequential pay-all chain. */
  step?: { current: number; total: number }
  resolve: () => void
  reject: (err: Error) => void
}

interface UiState {
  toasts: Toast[]
  success: SuccessData | null
  checkout: CheckoutRequest | null
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  showSuccess: (data: SuccessData) => void
  clearSuccess: () => void
  setCheckout: (req: CheckoutRequest | null) => void
}

let toastSeq = 0

export const useUiStore = create<UiState>()((set) => ({
  toasts: [],
  success: null,
  checkout: null,
  pushToast: (toast) =>
    set((s) => ({
      // keep at most 3 on screen
      toasts: [...s.toasts.slice(-2), { ...toast, id: `t-${++toastSeq}` }],
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  showSuccess: (data) => set({ success: data }),
  clearSuccess: () => set({ success: null }),
  setCheckout: (req) => set({ checkout: req }),
}))

/** Imperative helpers usable from services (outside React). */
export function toast(title: string, body?: string, tone: ToastTone = 'info'): void {
  useUiStore.getState().pushToast({ title, body, tone })
}

export function showSuccess(data: SuccessData): void {
  useUiStore.getState().showSuccess(data)
}

/**
 * Mock Razorpay. `checkout()` resolves/rejects when the user completes or
 * abandons the branded checkout modal (MockRazorpayModal), which watches
 * `uiStore.checkout`. Deterministic — failure only via the explicit
 * "simulate a failed payment" affordance.
 */
import { useUiStore } from '@/store/uiStore'

export interface CheckoutOptions {
  title: string
  description: string
  amount: number
  step?: { current: number; total: number }
}

export function checkout(options: CheckoutOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    useUiStore.getState().setCheckout({
      ...options,
      resolve: () => {
        useUiStore.getState().setCheckout(null)
        resolve()
      },
      reject: (err: Error) => {
        useUiStore.getState().setCheckout(null)
        reject(err)
      },
    })
  })
}

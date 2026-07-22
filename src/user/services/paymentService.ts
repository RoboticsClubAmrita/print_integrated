/**
 * Real Razorpay Checkout, driven by the backend's `/payments/create-order`
 * (or `/payments/penalties/create-order`) response. The Checkout script tag
 * is loaded globally in `index.html`.
 */

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

export interface OpenCheckoutOptions {
  keyId: string
  orderId: string
  amountInPaise: number
  currency: string
  description: string
  prefill?: { name?: string; email?: string; contact?: string }
}

/** Opens the Razorpay Checkout modal; resolves with the payment fields `/payments/verify` needs. */
export function openCheckout(options: OpenCheckoutOptions): Promise<RazorpayResponse> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Payment gateway failed to load. Check your connection and try again.'))
      return
    }
    const rzp = new window.Razorpay({
      key: options.keyId,
      order_id: options.orderId,
      amount: options.amountInPaise,
      currency: options.currency,
      name: 'PrintEase',
      description: options.description,
      prefill: options.prefill,
      theme: { color: '#0B0B0D' },
      handler: (response: RazorpayResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled.')),
      },
    })
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description ?? 'Payment failed.'))
    })
    rzp.open()
  })
}

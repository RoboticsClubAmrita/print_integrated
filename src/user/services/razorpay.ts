/**
 * Real Razorpay checkout, in the browser.
 *
 * Money moves through the gateway and nowhere else. The amount is never sent
 * from here — the backend reads it off the job it priced, creates the Razorpay
 * order, and hands back only the order id and the publishable key. What comes
 * back from checkout is then verified server-side against the key secret, so a
 * forged success callback cannot mark anything paid.
 *
 * The user's card, UPI and netbanking details are entered in Razorpay's own
 * iframe. They never touch this application.
 */
import { paymentService as realPayments } from '../../services/api'
import { apiErrorMessage } from '@/lib/apiError'

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/** Raised when a payment could not be completed. */
export class PaymentError extends Error {
  /** True when the user closed the checkout themselves — not a failure to report loudly. */
  readonly cancelled: boolean

  constructor(message: string, cancelled = false) {
    super(message)
    this.name = 'PaymentError'
    this.cancelled = cancelled
  }
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (payload: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

let loader: Promise<void> | null = null

/** Injects the checkout script once, and reuses the same promise thereafter. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loader = null // let a later attempt retry rather than failing forever
      reject(new PaymentError('Could not reach the payment gateway. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })

  return loader
}

export interface PaidResult {
  /** Razorpay's id for the settled payment, as confirmed by our backend. */
  paymentId: string
  /** What was actually charged, in rupees, as priced by the backend. */
  amount: number
}

interface Payer {
  name?: string | null
  email?: string | null
  phone?: string | null
}

/**
 * Opens checkout for one print job and resolves once the backend has verified
 * the signature. Rejects with a [PaymentError] otherwise — including when the
 * user dismisses the window, which is flagged rather than reported as an error.
 */
export async function payForJob(jobId: string, payer: Payer = {}): Promise<PaidResult> {
  return checkout(() => realPayments.createOrder({ jobId }), payer, 'Campus printing')
}

/**
 * Opens checkout for a user's outstanding storage penalties. Same guarantees:
 * the backend decides the amount and verifies the result.
 */
export async function payDues(userId: string, payer: Payer = {}): Promise<PaidResult> {
  return checkout(() => realPayments.createPenaltyOrder(userId), payer, 'Outstanding dues')
}

async function checkout(
  createOrder: () => Promise<unknown>,
  payer: Payer,
  description: string,
): Promise<PaidResult> {
  await loadCheckout()

  let created: {
    orderId?: string
    keyId?: string
    amount?: number
    amountInPaise?: number
    currency?: string
  }
  try {
    const res = (await createOrder()) as { DATA?: typeof created } & typeof created
    created = res?.DATA ?? res
  } catch (err) {
    throw new PaymentError(apiErrorMessage(err, 'Could not start the payment.'))
  }

  if (!created?.orderId || !created?.keyId) {
    throw new PaymentError('The payment gateway is not configured. Please contact the print desk.')
  }

  const Checkout = window.Razorpay
  if (!Checkout) {
    throw new PaymentError('Could not reach the payment gateway. Check your connection and try again.')
  }

  return new Promise<PaidResult>((resolve, reject) => {
    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      fn()
    }

    const checkout = new Checkout({
      key: created.keyId,
      order_id: created.orderId,
      // Razorpay takes the authoritative amount from the order it was created
      // with; these are for display only.
      amount: created.amountInPaise,
      currency: created.currency ?? 'INR',
      name: 'PrintEase',
      description,
      prefill: {
        name: payer.name ?? undefined,
        email: payer.email ?? undefined,
        contact: payer.phone ?? undefined,
      },
      theme: { color: '#0b0b0d' },
      modal: {
        ondismiss: () =>
          finish(() =>
            reject(new PaymentError('Payment cancelled — your order is still waiting to be paid.', true)),
          ),
      },
      handler: (response: RazorpayHandlerResponse) => {
        // Checkout says it succeeded; only the backend's signature check
        // decides whether it actually did.
        realPayments
          .verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          .then(() =>
            finish(() =>
              resolve({
                paymentId: response.razorpay_payment_id,
                amount: Number(created.amount ?? 0),
              }),
            ),
          )
          .catch((err) =>
            finish(() =>
              reject(
                new PaymentError(
                  apiErrorMessage(
                    err,
                    'Your payment went through but could not be confirmed. Do not pay again — contact the print desk with your payment id.',
                  ),
                ),
              ),
            ),
          )
      },
    })

    checkout.on('payment.failed', (payload) =>
      finish(() =>
        reject(new PaymentError(payload?.error?.description || 'The payment did not go through.')),
      ),
    )

    checkout.open()
  })
}

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { rupees } from '@/lib/pricing'
import { useUiStore } from '@/store/uiStore'

/**
 * Branded stand-in for the Razorpay checkout sheet. Resolves/rejects the
 * pending `paymentService.checkout()` promise. Deterministic: failure only
 * via the explicit "simulate a failed payment" link, never at random.
 */
export function MockRazorpayModal() {
  const checkout = useUiStore((s) => s.checkout)
  const [busy, setBusy] = useState<'pay' | 'fail' | null>(null)

  if (!checkout) return null
  const { title, description, amount, step, resolve, reject } = checkout

  const pay = async () => {
    setBusy('pay')
    await new Promise((r) => setTimeout(r, 1800))
    resolve()
  }

  const simulateFailure = async () => {
    setBusy('fail')
    await new Promise((r) => setTimeout(r, 1800))
    reject(new Error('Payment failed'))
  }

  return (
    <Modal
      open
      onClose={() => reject(new Error('Payment cancelled'))}
      dismissible={!busy}
      showClose={!busy}
      size="sm"
    >
      <div className="text-center">
        <div className="mx-auto grid place-items-center size-12 rounded-full bg-chip mb-4">
          <ShieldCheck size={22} className="text-ink" strokeWidth={2} />
        </div>
        <p className="text-[13px] font-bold text-muted uppercase tracking-wide">{title}</p>
        <p className="mt-1 text-[15px] font-semibold text-ink">{description}</p>
        {step && (
          <p className="mt-1 text-[12px] font-bold text-warning">
            Paying {step.current} of {step.total}
          </p>
        )}
        <p className="mt-4 text-[38px] font-extrabold tracking-[-1px] tabular-nums">
          {rupees(amount)}
        </p>
      </div>

      <Button
        fullWidth
        className="mt-6"
        loading={busy === 'pay'}
        disabled={busy === 'fail'}
        onClick={pay}
      >
        Pay {rupees(amount)}
      </Button>

      <button
        type="button"
        disabled={!!busy}
        onClick={simulateFailure}
        className="mt-4 mx-auto block text-[12.5px] font-semibold text-muted hover:text-danger transition-colors disabled:opacity-40"
      >
        {busy === 'fail' ? 'Simulating failure…' : 'Simulate a failed payment'}
      </button>
    </Modal>
  )
}

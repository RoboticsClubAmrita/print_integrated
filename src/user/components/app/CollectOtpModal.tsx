import { useEffect, useRef, useState } from 'react'
import { Truck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import type { Order } from '@/types'
import { confirmCollection, requestCollection } from '@/services/orderService'
import { showSuccess } from '@/store/uiStore'

/**
 * Collection confirmation (order_detail_screen.dart): requests a fresh
 * code whenever it opens, verifies on submit, then shows the
 * "Collection Confirmed" success overlay naming the stack to collect from.
 */
export function CollectOtpModal({
  open,
  order,
  onClose,
  onCollected,
}: {
  open: boolean
  order: Order | null
  onClose: () => void
  onCollected: (stackName: string) => void
}) {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('your email')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Keyed on the job id, not the order object: every refresh (poll, live
  // update, penalty tick) hands this modal a new `order` object for the same
  // job, and re-running would email a fresh code that silently invalidates
  // the one the user is typing — "Invalid OTP", button still there.
  const jobId = order?.jobId
  const orderRef = useRef(order)
  useEffect(() => {
    orderRef.current = order
  })
  useEffect(() => {
    const current = orderRef.current
    if (!open || !jobId || !current) return
    setCode('')
    setError(null)
    requestCollection(current)
      .then((r) => setEmail(r.email))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not send the code. Try again.')
      })
  }, [open, jobId])

  const verify = async (otp: string) => {
    if (!order || otp.length < 4) return
    setBusy(true)
    setError(null)
    const result = await confirmCollection(order.jobId, otp)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
    const stackName = result.stackName ?? order.stackName ?? null
    showSuccess({
      title: 'Collection Confirmed',
      subtitle: stackName
        ? `Collect your prints from Stack ${stackName}.`
        : 'Enjoy your prints!',
      icon: 'package',
    })
    onCollected(stackName ?? '')
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto grid place-items-center size-12 rounded-full bg-chip mb-4">
          <Truck size={21} className="text-ink" strokeWidth={2} />
        </div>
        <h2 className="text-[18px] font-extrabold tracking-[-0.2px]">Confirm collection</h2>
        <p className="mt-1.5 text-[13.5px] font-medium text-muted">
          Enter the 4-digit code sent to {email}.
        </p>
      </div>

      <div className="mt-6">
        <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} error={!!error} />
        {error && (
          <p role="alert" className="mt-3 text-center text-[12.5px] font-semibold text-danger">
            {error}
          </p>
        )}
      </div>

      <Button fullWidth className="mt-6" loading={busy} disabled={code.length < 4} onClick={() => verify(code)}>
        Confirm collection
      </Button>
    </Modal>
  )
}

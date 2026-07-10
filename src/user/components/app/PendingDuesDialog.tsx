import { Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { rupees } from '@/lib/pricing'

/**
 * Blocks collection while dues are outstanding (order_detail_screen.dart):
 * barrier/Escape dismissible only, no OTP is ever generated while this is up.
 */
export function PendingDuesDialog({
  open,
  amount,
  onClose,
}: {
  open: boolean
  amount: number
  onClose: () => void
}) {
  const navigate = useNavigate()
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto grid place-items-center size-12 rounded-full bg-warning/12 mb-4">
          <Wallet size={22} className="text-warning" strokeWidth={2} />
        </div>
        <h2 className="text-[18px] font-extrabold tracking-[-0.2px]">Pending Dues</h2>
        <p className="mt-2 text-[14px] font-medium text-muted leading-relaxed">
          You have pending dues. Please complete the payment before collecting your printed
          materials.
        </p>
        {amount > 0 && (
          <p className="mt-3 text-[15px] font-extrabold text-ink">
            Outstanding: {rupees(amount)}
          </p>
        )}
      </div>
      <Button
        fullWidth
        className="mt-6"
        onClick={() => {
          onClose()
          navigate('/app/billing')
        }}
      >
        Go to Billing
      </Button>
      <p className="mt-3 text-center text-[12px] font-medium text-muted/80">
        Tap outside to dismiss
      </p>
    </Modal>
  )
}

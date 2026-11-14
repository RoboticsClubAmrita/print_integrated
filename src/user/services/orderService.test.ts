/**
 * cancelOrder must always leave the screen showing the real status: on a
 * refused cancel (printing already started) it refreshes before surfacing
 * the backend's reason, so a stale "Cancel Order" button cannot linger.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
const cancel = vi.fn()

vi.mock('@/store/appStore', () => ({
  useAppStore: { getState: () => ({ refresh }) },
}))
vi.mock('../../services/api', () => ({
  jobService: { cancel: (...args: unknown[]) => cancel(...args) },
  fileService: {},
}))
vi.mock('@/services/razorpay', () => ({ payForJob: vi.fn(), PaymentError: class extends Error {} }))
vi.mock('@/services/pendingUploads', () => ({
  attachJob: vi.fn(),
  dropPending: vi.fn(),
  putPending: vi.fn(),
}))
vi.mock('@/lib/adapters', () => ({ jobToOrder: vi.fn() }))

const { cancelOrder } = await import('./orderService')

describe('cancelOrder', () => {
  beforeEach(() => {
    refresh.mockReset().mockResolvedValue(undefined)
    cancel.mockReset()
  })

  it('cancels and refreshes the order list', async () => {
    cancel.mockResolvedValue({ MESSAGE: 'ok' })

    await cancelOrder('job-1', 'changed my mind')

    expect(cancel).toHaveBeenCalledWith({ jobId: 'job-1', reason: 'changed my mind' })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes and rethrows the backend reason when printing already started', async () => {
    const reason = 'Cannot cancel a job with status "PRINTING". Printing has already started or finished.'
    cancel.mockRejectedValue({ response: { status: 400, data: { MESSAGE: reason } } })

    await expect(cancelOrder('job-1')).rejects.toThrow(reason)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('still rethrows the cancel error when the follow-up refresh also fails', async () => {
    cancel.mockRejectedValue({ response: { data: { MESSAGE: 'too late' } } })
    refresh.mockRejectedValue(new Error('offline'))

    await expect(cancelOrder('job-1')).rejects.toThrow('too late')
  })
})

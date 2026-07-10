import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { parsePageRange } from '@/lib/pageRange'

/**
 * "Choose pages" dialog (home_screen.dart _pickPageRange): free-text range
 * input validated live against the parser's exact error messages. Applying
 * a selection equal to every page stores it as null ("All"), matching the
 * app's semantics.
 */
export function PageRangeDialog({
  open,
  totalPages,
  initial,
  onApply,
  onClose,
}: {
  open: boolean
  totalPages: number
  initial: number[] | null
  onApply: (pages: number[] | null) => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setText(initial ? initial.join(', ') : '')
      setError(null)
    }
  }, [open, initial])

  const apply = () => {
    try {
      const pages = parsePageRange(text, totalPages)
      onApply(pages.length === totalPages ? null : pages)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid page range')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Choose pages" size="sm">
      <p className="text-[14px] font-medium text-muted -mt-2 mb-4">
        This document has {totalPages} pages.
      </p>
      <input
        autoFocus
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder="e.g. 1-5, 8, 11-13"
        aria-invalid={!!error}
        className="w-full h-14 px-4 rounded-[22px] border-[1.6px] bg-white text-[16px] font-bold text-ink outline-none placeholder:text-muted/70 placeholder:font-medium transition-colors duration-180"
        style={{ borderColor: error ? 'var(--color-danger)' : 'var(--color-line)' }}
      />
      {error ? (
        <p role="alert" className="mt-2 pl-1 text-[12.5px] font-semibold text-danger">
          {error}
        </p>
      ) : (
        <p className="mt-2 pl-1 text-[12.5px] font-medium text-muted">Leave blank for all pages</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="md" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" fullWidth onClick={apply}>
          Apply
        </Button>
      </div>
    </Modal>
  )
}

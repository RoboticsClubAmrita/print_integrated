import { useRef, useState } from 'react'
import { FileText, Image, UploadCloud, X, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'motion/react'
import { ACCEPT_ATTR, ACCEPTED_LABEL, isAccepted, type StoredFile } from '@/services/fileService'
import { toast } from '@/store/uiStore'
import { EASE } from '@/lib/motion'

const KIND_ICON = { pdf: FileText, image: Image, doc: FileText } as const

/**
 * Web-native upgrade of the app's file picker: a large drag-and-drop zone
 * (in addition to click-to-browse). Rejects unsupported extensions with a
 * toast, matching the app's allowed-extension list exactly.
 */
export function FileDropZone({
  stored,
  pages,
  detecting,
  onFile,
  onClear,
}: {
  stored: StoredFile | null
  pages: number | null
  detecting: boolean
  onFile: (file: File) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const accept = (file: File | undefined) => {
    if (!file) return
    if (!isAccepted(file.name)) {
      toast('Unsupported file type', `Choose one of: ${ACCEPTED_LABEL}. Save Word or PowerPoint documents as PDF first.`, 'warning')
      return
    }
    onFile(file)
  }

  if (stored) {
    const Icon = KIND_ICON[stored.kind]
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex items-center gap-4 rounded-[16px] border border-line bg-bg/50 px-4 py-4"
      >
        <span className="relative grid size-12 shrink-0 place-items-center rounded-[16px] bg-ink text-white shadow-[0_4px_12px_rgb(11_11_13_/_0.3)]">
          <Icon size={21} strokeWidth={1.8} />
          {!detecting && pages !== null && (
            <CheckCircle2
              size={16}
              strokeWidth={2.4}
              className="absolute -bottom-1 -right-1 rounded-full bg-white text-success"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{stored.file.name}</p>
          <p className="mt-0.5 text-[12.5px] font-medium text-muted">
            {stored.sizeKb} KB ·{' '}
            {detecting ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-warning animate-pulse-dot" />
                Counting…
              </span>
            ) : pages !== null ? (
              `${pages} page${pages === 1 ? '' : 's'} detected`
            ) : (
              '—'
            )}
          </p>
        </div>
        <button
          type="button"
          aria-label="Remove file"
          onClick={onClear}
          className="press grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white transition-colors hover:bg-chip"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      </motion.div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        accept(e.dataTransfer.files[0])
      }}
      className={clsx(
        'group w-full rounded-[16px] border-[1.5px] border-dashed px-6 py-9 text-center transition-colors duration-200',
        dragging ? 'border-success bg-success/[0.05]' : 'border-line hover:border-ink/30',
      )}
    >
      <motion.span
        animate={{ y: dragging ? -4 : 0, scale: dragging ? 1.06 : 1 }}
        transition={{ duration: 0.22, ease: EASE }}
        className="relative mx-auto mb-3.5 grid size-12 place-items-center rounded-[14px] bg-ink text-white"
      >
        <UploadCloud size={21} strokeWidth={1.8} />
      </motion.span>
      <p className="text-[14.5px] font-bold text-ink">
        {dragging ? 'Release to upload' : 'Drop a file here, or tap to upload'}
      </p>
      <p className="mt-1 text-[12.5px] font-medium text-muted">
        {ACCEPTED_LABEL} · converted to PDF and counted on this device
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={(e) => accept(e.target.files?.[0])}
        className="hidden"
      />
    </button>
  )
}

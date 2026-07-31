import { useRef, useState } from 'react'
import { FileText, FolderOpen, UploadCloud, X } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'motion/react'
import { isAccepted } from '@/services/fileService'
import { toast } from '@/store/uiStore'
import { EASE } from '@/lib/motion'

type FolderDropZoneProps = {
  files: File[]
  onFiles: (files: File[]) => void
  onClear: () => void
}

export function FolderDropZone({
  files,
  onFiles,
  onClear,
}: FolderDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const fileKey = (file: File) =>
    [
      file.webkitRelativePath || file.name,
      file.size,
      file.lastModified,
    ].join('::')

  const acceptFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const allFiles = Array.from(selectedFiles)

    if (allFiles.length === 0) {
      toast(
        'No files selected',
        'Choose one or more supported files.',
        'warning',
      )
      return
    }

    const supportedFiles = allFiles.filter((file) =>
      isAccepted(file.name),
    )

    const unsupportedCount =
      allFiles.length - supportedFiles.length

    if (supportedFiles.length === 0) {
      toast(
        'No supported files',
        'Choose PDF, DOC, DOCX, JPG or PNG files.',
        'warning',
      )
      return
    }

    if (unsupportedCount > 0) {
      toast(
        'Some files were skipped',
        `${unsupportedCount} unsupported file${
          unsupportedCount === 1 ? '' : 's'
        } ${unsupportedCount === 1 ? 'was' : 'were'} skipped.`,
        'warning',
      )
    }

    const existingKeys = new Set(files.map(fileKey))
    const newUniqueFiles = supportedFiles.filter(
      (file) => !existingKeys.has(fileKey(file)),
    )

    if (newUniqueFiles.length === 0) {
      toast(
        'Files already selected',
        'The selected files are already in the upload list.',
        'warning',
      )
      return
    }

    onFiles([...files, ...newUniqueFiles])
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const openFolderPicker = () => {
    folderInputRef.current?.click()
  }

  const hiddenInputs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(event) => {
          acceptFiles(event.target.files)
          event.target.value = ''
        }}
        className="hidden"
      />

      <input
        ref={folderInputRef}
        type="file"
        multiple
        onChange={(event) => {
          acceptFiles(event.target.files)
          event.target.value = ''
        }}
        className="hidden"
        {...{
          webkitdirectory: '',
          directory: '',
        }}
      />
    </>
  )

  if (files.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="rounded-[16px] border border-line bg-bg/50 px-4 py-4"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-ink text-white shadow-[0_4px_12px_rgb(11_11_13_/_0.3)]">
            <FolderOpen size={21} strokeWidth={1.8} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">
              {files.length} file{files.length === 1 ? '' : 's'} selected
            </p>

            <p className="mt-0.5 text-[12.5px] font-medium text-muted">
              Files ready to be merged
            </p>
          </div>

          <button
            type="button"
            aria-label="Clear selected files"
            onClick={onClear}
            className="press grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white transition-colors hover:bg-chip"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
          {files.map((file, index) => {
            const displayPath =
              file.webkitRelativePath || file.name

            return (
              <div
                key={`${displayPath}-${file.size}-${file.lastModified}-${index}`}
                className="flex items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2"
              >
                <FileText
                  size={15}
                  strokeWidth={1.8}
                  className="shrink-0 text-muted"
                />

                <p
                  title={displayPath}
                  className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink"
                >
                  {displayPath}
                </p>

                <span className="shrink-0 text-[11px] font-medium text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={openFilePicker}
            className="press rounded-[12px] border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-chip"
          >
            Add files
          </button>

          <button
            type="button"
            onClick={openFolderPicker}
            className="press rounded-[12px] border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-chip"
          >
            Add folder
          </button>
        </div>

        {hiddenInputs}
      </motion.div>
    )
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        acceptFiles(event.dataTransfer.files)
      }}
      className={clsx(
        'group w-full rounded-[16px] border-[1.5px] border-dashed px-6 py-9 text-center outline-none transition-colors duration-200',
        dragging
          ? 'border-success bg-success/[0.05]'
          : 'border-line',
      )}
    >
      <motion.span
        animate={{
          y: dragging ? -4 : 0,
          scale: dragging ? 1.06 : 1,
        }}
        transition={{ duration: 0.22, ease: EASE }}
        className="relative mx-auto mb-3.5 grid size-12 place-items-center rounded-[14px] bg-ink text-white"
      >
        <UploadCloud size={21} strokeWidth={1.8} />
      </motion.span>

      <p className="text-[14.5px] font-bold text-ink">
        {dragging
          ? 'Release to add files'
          : 'Choose files or a folder'}
      </p>

      <p className="mt-1 text-[12.5px] font-medium text-muted">
        PDF, DOC, DOCX, JPG or PNG files are supported
      </p>

      <p className="mt-2 text-[11.5px] font-medium text-muted">
        You can add individual files and folders to the same upload
      </p>

      <div className="mx-auto mt-5 grid max-w-sm gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={openFilePicker}
          className="press rounded-[12px] bg-ink px-4 py-2.5 text-[13px] font-bold text-white"
        >
          Choose files
        </button>

        <button
          type="button"
          onClick={openFolderPicker}
          className="press rounded-[12px] border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-chip"
        >
          Choose folder
        </button>
      </div>

      {hiddenInputs}
    </div>
  )
}
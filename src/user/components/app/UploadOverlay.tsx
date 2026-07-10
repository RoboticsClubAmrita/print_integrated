import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { DUR, EASE } from '@/lib/motion'

/**
 * Non-dismissible upload overlay (upload_progress.dart): spinning ring,
 * caption steps from "Uploading document…" to "Analyzing pages…" 1.5s in.
 */
export function UploadOverlay({ open, fileName }: { open: boolean; fileName: string }) {
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!open) {
      setAnalyzing(false)
      return
    }
    const t = setTimeout(() => setAnalyzing(true), 1500)
    return () => clearTimeout(t)
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.normal, ease: EASE }}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/60 backdrop-blur-sm px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DUR.slow, ease: EASE }}
            className="dark-panel relative overflow-hidden rounded-[28px] px-8 py-9 max-w-[340px] w-full text-center"
          >
            <div aria-hidden className="absolute inset-0 bg-dots pointer-events-none" />
            <div className="relative mx-auto grid place-items-center size-14 rounded-full border-[3px] border-white/15 border-t-white animate-spin-ring" />
            <p className="relative mt-5 text-[15px] font-extrabold text-white truncate">
              {fileName}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={analyzing ? 'analyzing' : 'uploading'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="relative mt-1.5 text-[13px] font-medium text-white/60"
              >
                {analyzing ? 'Analyzing pages…' : 'Uploading document…'}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

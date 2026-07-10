import { useEffect } from 'react'

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · PrintEase`
    return () => {
      document.title = 'PrintEase — Campus printing, minus the queue'
    }
  }, [title])
}

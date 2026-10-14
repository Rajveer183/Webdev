import { useEffect } from 'react'

/** Calls `onEscape` when the Escape key is pressed (used by dialogs and drawers). */
export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onEscape()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onEscape])
}

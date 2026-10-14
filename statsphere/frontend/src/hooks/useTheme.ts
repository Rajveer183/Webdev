import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
const KEY = 'statsphere-theme'

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(choice: ThemeChoice) {
  document.documentElement.setAttribute('data-theme', choice === 'system' ? systemTheme() : choice)
}

export function useTheme() {
  // Start from 'system' so server HTML and the first client render agree; the saved choice
  // (already applied to <html> by the inline script in index.html) is read after mount.
  const [choice, setChoice] = useState<ThemeChoice>('system')
  useEffect(() => setChoice(readChoice()), [])

  useEffect(() => {
    apply(choice)
    if (choice !== 'system') return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq?.addEventListener('change', onChange)
    return () => mq?.removeEventListener('change', onChange)
  }, [choice])

  const update = useCallback((next: ThemeChoice) => {
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
    setChoice(next)
  }, [])

  return { choice, setTheme: update }
}

import { useEffect, useRef } from 'react'

/**
 * Fades content in as it scrolls into view. Classes are added only after mount, so prerendered
 * HTML and hydration are unaffected; content already on screen is never hidden, and nothing
 * animates when the visitor prefers reduced motion.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return // already visible
    el.classList.add('reveal')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('reveal-in')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

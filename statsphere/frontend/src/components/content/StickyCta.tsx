import { useEffect, useState } from 'react'

/**
 * Mobile-only bottom bar with the page's main action. Appears after the visitor scrolls past
 * the header and hides while the enquiry form (#enquire) is on screen.
 */
export function StickyCta({ title, label, target = '#enquire' }: { title: string; label: string; target?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const el = document.querySelector(target)
    const io = el ? new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0.05 }) : null
    if (el && io) io.observe(el)
    return () => {
      window.removeEventListener('scroll', onScroll)
      io?.disconnect()
    }
  }, [target])

  const show = scrolled && !formVisible
  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur transition-transform duration-300 lg:hidden ${
        show ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-ink">{title}</p>
        <a href={target} tabIndex={show ? 0 : -1} className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-hover">
          {label}
        </a>
      </div>
    </div>
  )
}

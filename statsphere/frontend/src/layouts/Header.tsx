import { Menu, Monitor, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LinkButton } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { useSite } from '../hooks/useSite'
import { useTheme, type ThemeChoice } from '../hooks/useTheme'

export const NAV = [
  { to: '/services', label: 'Consulting' },
  { to: '/courses', label: 'Certificate Courses' },
  { to: '/corporate-training', label: 'Corporate Training' },
  { to: '/knowledge', label: 'Knowledge Hub' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
]

const THEMES: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
  { value: 'system', label: 'Match system theme', icon: Monitor },
]

function ThemeSwitch() {
  const { choice, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center rounded-lg border border-line bg-surface p-0.5">
      {THEMES.map(({ value, label, icon: I }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            choice === value ? 'bg-surface-3 text-ink' : 'text-subtle hover:text-ink'
          }`}
        >
          <I className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { name, brandLogoUrl } = useSite()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      className={`sticky top-0 z-40 border-b transition ${
        scrolled ? 'border-line bg-surface/90 backdrop-blur-md' : 'border-transparent bg-surface'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label={`${name} home`} className="shrink-0 rounded-lg">
          <Logo name={name} imageUrl={brandLogoUrl} />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap transition ${
                      isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeSwitch />
          </div>
          <div className="hidden md:block">
            <LinkButton to="/contact?type=consulting" size="sm">
              Book a Consultation
            </LinkButton>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-2 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-line bg-surface xl:hidden">
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="grid gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-base font-medium ${isActive ? 'bg-surface-2 text-ink' : 'text-muted'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/contact" className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted">
                  Contact
                </NavLink>
              </li>
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <ThemeSwitch />
              <LinkButton to="/contact?type=consulting" size="sm">
                Book a Consultation
              </LinkButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

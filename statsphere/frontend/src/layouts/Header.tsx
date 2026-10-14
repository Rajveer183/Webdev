import { ChevronDown, Menu, Monitor, Moon, Sun, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from '../components/ui/Logo'
import { useSite } from '../hooks/useSite'
import { useTheme } from '../hooks/useTheme'

const TRAINING_LINKS = [
  { to: '/courses', label: 'Certificate Courses', desc: 'Practical statistics & data science courses' },
  { to: '/corporate-training', label: 'Corporate Training', desc: 'Customised workshops for organisations' },
]

function ThemeSwitch() {
  const { choice, setTheme } = useTheme()

  const cycleTheme = () => {
    if (choice === 'light') setTheme('dark')
    else if (choice === 'dark') setTheme('system')
    else setTheme('light')
  }

  const current =
    choice === 'light'
      ? { icon: Sun, label: 'Current theme: Light. Click for Dark mode.' }
      : choice === 'dark'
      ? { icon: Moon, label: 'Current theme: Dark. Click for System mode.' }
      : { icon: Monitor, label: 'Current theme: System. Click for Light mode.' }

  const IconComponent = current.icon

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={current.label}
      title={current.label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--bg-section)] hover:text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <IconComponent className="h-4 w-4 transition-transform duration-200" aria-hidden />
    </button>
  )
}

function TrainingDropdown({ isCurrent }: { isCurrent: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg ${
          isCurrent
            ? 'text-[var(--text-heading)] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[var(--accent)] after:rounded-full'
            : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
        }`}
      >
        <span>Training</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 pt-1">
          <div className="w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg backdrop-blur-md">
            {TRAINING_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition-colors duration-150 ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold'
                      : 'text-[var(--text-body)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]'
                  }`
                }
              >
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{item.desc}</div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { name, brandLogoUrl } = useSite()

  const isTrainingActive = pathname.startsWith('/courses') || pathname.startsWith('/corporate-training')

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
        scrolled ? 'border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md' : 'border-transparent bg-[var(--surface)]'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label={`${name} home`} className="shrink-0 rounded-lg">
          <Logo name={name} imageUrl={brandLogoUrl} />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            <li>
              <NavLink
                to="/services"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isActive
                      ? 'text-[var(--text-heading)] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[var(--accent)] after:rounded-full'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`
                }
              >
                Consulting
              </NavLink>
            </li>
            <li>
              <TrainingDropdown isCurrent={isTrainingActive} />
            </li>
            <li>
              <NavLink
                to="/knowledge"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isActive
                      ? 'text-[var(--text-heading)] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[var(--accent)] after:rounded-full'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`
                }
              >
                Knowledge Hub
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isActive
                      ? 'text-[var(--text-heading)] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[var(--accent)] after:rounded-full'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`
                }
              >
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isActive
                      ? 'text-[var(--text-heading)] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[var(--accent)] after:rounded-full'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`
                }
              >
                About
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block">
            <ThemeSwitch />
          </div>
          <div className="hidden md:block">
            <Link
              to="/contact?type=consulting"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white dark:text-[#060D1F] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Book a Consultation
            </Link>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-heading)] hover:bg-[var(--bg-section-alt)] xl:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
        <div id="mobile-nav" className="border-t border-[var(--border)] bg-[var(--surface)] xl:hidden">
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="grid gap-1">
              <li>
                <NavLink
                  to="/services"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-medium ${
                      isActive ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-body)] hover:bg-[var(--bg-section-alt)]'
                    }`
                  }
                >
                  Consulting
                </NavLink>
              </li>
              <li className="pt-1 pb-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Training</div>
                <div className="mt-1 pl-2 grid gap-1">
                  {TRAINING_LINKS.map((t) => (
                    <NavLink
                      key={t.to}
                      to={t.to}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm font-medium ${
                          isActive ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-section-alt)]'
                        }`
                      }
                    >
                      {t.label}
                    </NavLink>
                  ))}
                </div>
              </li>
              <li>
                <NavLink
                  to="/knowledge"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-medium ${
                      isActive ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-body)] hover:bg-[var(--bg-section-alt)]'
                    }`
                  }
                >
                  Knowledge Hub
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-medium ${
                      isActive ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-body)] hover:bg-[var(--bg-section-alt)]'
                    }`
                  }
                >
                  Projects
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-medium ${
                      isActive ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-body)] hover:bg-[var(--bg-section-alt)]'
                    }`
                  }
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-medium ${
                      isActive ? 'bg-[var(--accent-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-body)] hover:bg-[var(--bg-section-alt)]'
                    }`
                  }
                >
                  Contact
                </NavLink>
              </li>
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <ThemeSwitch />
              <Link
                to="/contact?type=consulting"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white dark:text-[#060D1F] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Book a Consultation
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

import { FileUp, Inbox, LayoutDashboard, Library, LogOut, ScrollText, Settings, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LogoMark } from '../../components/ui/Logo'
import { usePageMeta } from '../../hooks/usePageMeta'
import { adminRequest, tokenStore } from './adminApi'
import { AdminLogin } from './AdminLogin'
import { CatalogueTab } from './CatalogueTab'
import { EnquiriesTab } from './EnquiriesTab'
import { IngestionTab } from './IngestionTab'
import { OverviewTab } from './OverviewTab'
import { SettingsTab } from './SettingsTab'
import { TopicsTab } from './TopicsTab'
import { UsersTab } from './UsersTab'

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'enquiries', label: 'Enquiries', icon: Inbox },
  { key: 'catalogue', label: 'Catalogue', icon: Library },
  { key: 'topics', label: 'PDF topics', icon: ScrollText },
  { key: 'ingestion', label: 'PDF ingestion', icon: FileUp },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'users', label: 'Admin users', icon: Users },
] as const

export default function AdminPage() {
  usePageMeta({ title: 'Admin', description: 'Administration', noindex: true })
  const [user, setUser] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.key === params.get('tab'))?.key ?? 'overview') as (typeof TABS)[number]['key']

  const verify = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null)
      setChecking(false)
      return
    }
    try {
      const me = await adminRequest<{ username: string }>('/me')
      setUser(me.username)
    } catch {
      setUser(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    verify()
    const onLogout = () => setUser(null)
    window.addEventListener('statsphere-admin-logout', onLogout)
    return () => window.removeEventListener('statsphere-admin-logout', onLogout)
  }, [verify])

  if (checking) return <div className="p-10 text-center text-muted">Checking session…</div>
  if (!user) return <AdminLogin onSuccess={verify} />

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <LogoMark className="h-7 w-7" /> SGT Consulting Services · admin
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">Signed in as {user}</span>
            <button
              type="button"
              onClick={() => {
                tokenStore.clear()
                setUser(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Admin sections">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map(({ key, label, icon: I }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-current={tab === key ? 'page' : undefined}
                  onClick={() => setParams({ tab: key })}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                    tab === key ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:bg-surface hover:text-ink'
                  }`}
                >
                  <I className="h-4 w-4" aria-hidden /> {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0">
          {tab === 'overview' && <OverviewTab onNavigate={(k) => setParams({ tab: k })} />}
          {tab === 'enquiries' && <EnquiriesTab />}
          {tab === 'catalogue' && <CatalogueTab />}
          {tab === 'topics' && <TopicsTab />}
          {tab === 'ingestion' && <IngestionTab />}
          {tab === 'settings' && <SettingsTab />}
          {tab === 'users' && <UsersTab />}
        </main>
      </div>
    </div>
  )
}

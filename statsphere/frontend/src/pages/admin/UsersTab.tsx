import { KeyRound, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { TextField } from '../../components/forms/Fields'
import { FormAlert } from '../../components/forms/FormParts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ErrorState, Loading } from '../../components/ui/States'
import { ApiError } from '../../services/api'
import { adminRequest, tokenStore } from './adminApi'

interface AdminUser {
  id: number
  username: string
  created_at: string
  last_login_at: string | null
  is_current: boolean
}

const message = (e: unknown) =>
  e instanceof ApiError ? (e.details.length ? e.details.map((d) => `${d.field}: ${d.message}`).join('; ') : e.message) : 'Request failed'

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>()
  const [error, setError] = useState<ApiError>()
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string }>()
  const [newUser, setNewUser] = useState({ username: '', password: '' })
  const [own, setOwn] = useState({ current_password: '', new_password: '', confirm: '' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    adminRequest<AdminUser[]>('/users').then(setUsers).catch(setError)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setNotice(undefined)
    try {
      await adminRequest('/users', { method: 'POST', body: newUser })
      setNotice({ tone: 'info', text: `Admin “${newUser.username}” created. Share the password with them securely.` })
      setNewUser({ username: '', password: '' })
      load()
    } catch (err) {
      setNotice({ tone: 'error', text: message(err) })
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword(u: AdminUser) {
    const password = window.prompt(`New password for ${u.username} (at least 12 characters). They will be signed out everywhere.`)
    if (!password) return
    try {
      await adminRequest(`/users/${u.id}/password`, { method: 'PUT', body: { password } })
      setNotice({ tone: 'info', text: `Password for ${u.username} reset.` })
    } catch (err) {
      setNotice({ tone: 'error', text: message(err) })
    }
  }

  async function remove(u: AdminUser) {
    if (!window.confirm(`Delete admin “${u.username}”? This cannot be undone.`)) return
    try {
      await adminRequest(`/users/${u.id}`, { method: 'DELETE' })
      setNotice({ tone: 'info', text: `Admin ${u.username} deleted.` })
      load()
    } catch (err) {
      setNotice({ tone: 'error', text: message(err) })
    }
  }

  async function changeOwn(e: FormEvent) {
    e.preventDefault()
    if (own.new_password !== own.confirm) {
      setNotice({ tone: 'error', text: 'The new passwords do not match.' })
      return
    }
    setBusy(true)
    try {
      const r = await adminRequest<{ access_token: string }>('/me/password', {
        method: 'POST',
        body: { current_password: own.current_password, new_password: own.new_password },
      })
      tokenStore.set(r.access_token) // this session continues; other sessions are signed out
      setOwn({ current_password: '', new_password: '', confirm: '' })
      setNotice({ tone: 'info', text: 'Your password has been changed. Other sessions have been signed out.' })
    } catch (err) {
      setNotice({ tone: 'error', text: message(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Admin users</h1>
        <p className="text-sm text-muted">Everyone listed here has full admin access. Remove accounts that are no longer needed.</p>
      </div>
      {notice && <FormAlert tone={notice.tone}>{notice.text}</FormAlert>}

      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !users ? (
        <Loading />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-surface-2 text-subtle">
              <tr>
                <th className="px-4 py-2.5 font-medium">Username</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">Last sign-in</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {u.username} {u.is_current && <Badge tone="brand">you</Badge>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-muted">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {!u.is_current && (
                      <>
                        <button type="button" onClick={() => resetPassword(u)} className="mr-3 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
                          <KeyRound className="h-3.5 w-3.5" aria-hidden /> Reset password
                        </button>
                        <button type="button" onClick={() => remove(u)} className="inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={create} className="card space-y-4 p-6" aria-label="Add an admin">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <UserPlus className="h-4 w-4 text-subtle" aria-hidden /> Add an admin
          </h2>
          <TextField
            label="Username"
            required
            autoComplete="off"
            hint="3–80 characters: letters, numbers, dot, dash, underscore."
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
          <TextField
            label="Initial password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 12 characters."
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <Button type="submit" size="sm" disabled={busy || !newUser.username || newUser.password.length < 12}>
            Create admin
          </Button>
        </form>

        <form onSubmit={changeOwn} className="card space-y-4 p-6" aria-label="Change my password">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <KeyRound className="h-4 w-4 text-subtle" aria-hidden /> Change my password
          </h2>
          <TextField
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={own.current_password}
            onChange={(e) => setOwn({ ...own, current_password: e.target.value })}
          />
          <TextField
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 12 characters."
            value={own.new_password}
            onChange={(e) => setOwn({ ...own, new_password: e.target.value })}
          />
          <TextField
            label="Repeat new password"
            type="password"
            required
            autoComplete="new-password"
            value={own.confirm}
            onChange={(e) => setOwn({ ...own, confirm: e.target.value })}
          />
          <Button type="submit" size="sm" disabled={busy || !own.current_password || own.new_password.length < 12}>
            Change password
          </Button>
        </form>
      </div>
    </div>
  )
}

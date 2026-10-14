import { LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { FormAlert } from '../../components/forms/FormParts'
import { TextField } from '../../components/forms/Fields'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { login } from './adminApi'

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(username, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-8" aria-label="Admin sign in">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-brand" aria-hidden />
          <h1 className="text-lg font-semibold text-ink">Admin sign in</h1>
        </div>
        <TextField label="Username" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <FormAlert tone="error">{error}</FormAlert>}
        <Button type="submit" className="w-full" disabled={busy || !username || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}

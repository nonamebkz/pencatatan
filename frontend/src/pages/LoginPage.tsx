import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, ShieldCheck, Waves } from 'lucide-react'

import { TextField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="safe-top safe-bottom flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_oklch(0.96_0.02_155)_0%,_var(--background)_50%)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[0_12px_32px_-8px_oklch(0.45_0.12_155/0.45)]">
            <Waves className="size-8" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pencatatan Usaha</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Masuk ke Akun</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Pantau kualitas air kolam lele dengan aman. Hubungi admin jika belum punya akun.
          </p>
        </div>

        <div className="rounded-3xl border bg-card/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nama@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextField
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="-mt-2 text-xs font-medium text-primary"
            >
              {showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            </button>

            {error && <ErrorAlert>{error}</ErrorAlert>}

            <Button type="submit" size="lg" disabled={submitting} className="w-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
              <Lock className="size-4" />
              Masuk
            </Button>
          </form>
        </div>

        <InfoCallout icon={ShieldCheck} className="mt-6 text-xs">
          <p>Tidak ada pendaftaran mandiri. Admin membuat akun pengguna untuk tim operasional kolam.</p>
        </InfoCallout>
      </div>
    </div>
  )
}

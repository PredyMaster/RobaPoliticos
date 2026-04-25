import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { signIn, signUp } from '../services/supabase/auth'

const s = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    padding: '24px',
    gap: 16,
  },
  title: { margin: 0, fontSize: 32, fontWeight: 800, color: '#f4c542' },
  subtitle: { margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  form: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 },
  input: {
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
  },
  btn: {
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: '#f4c542',
    color: '#1a1a2e',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  link: { background: 'none', border: 'none', color: '#f4c542', fontSize: 14, cursor: 'pointer', textDecoration: 'underline' },
  error: { color: '#ff6b6b', fontSize: 14, textAlign: 'center' },
} satisfies Record<string, React.CSSProperties>

export function LoginScreen() {
  const navigate   = useNavigate()
  const loadPlayer = usePlayerStore((s) => s.loadPlayer)

  const [mode, setMode]     = useState<'login' | 'register'>('login')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [username, setUser] = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [busy, setBusy]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = mode === 'login'
      ? await signIn({ email, password: pass })
      : await signUp({ email, password: pass, username })

    if (!result.ok) {
      setError(result.error)
      setBusy(false)
      return
    }

    await loadPlayer()
    navigate('/home', { replace: true })
  }

  return (
    <div style={s.root}>
      <h1 style={s.title}>Roba Políticos</h1>
      <p style={s.subtitle}>{mode === 'login' ? 'Inicia sesión' : 'Crear cuenta'}</p>

      <form style={s.form} onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            style={s.input}
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUser(e.target.value)}
            required
          />
        )}
        <input
          style={s.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={s.input}
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />
        {error && <span style={s.error}>{error}</span>}
        <button style={s.btn} type="submit" disabled={busy}>
          {busy ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Registrarse'}
        </button>
      </form>

      <button style={s.link} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? '¿Sin cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}

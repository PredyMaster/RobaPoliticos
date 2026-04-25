import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { getRunHistory } from '../services/supabase/runs'
import { C, FONT, cardStyle } from './shared/theme'

type RunRow = {
  id: string
  scoreGained: number
  coinsCollected: number
  maxCombo: number
  hits: number
  durationSeconds: number
  createdAt: string
}

export function ProfileScreen() {
  const navigate     = useNavigate()
  const profile      = usePlayerStore((s) => s.profile)
  const wallet       = usePlayerStore((s) => s.wallet)
  const session      = usePlayerStore((s) => s.session)
  const logout       = usePlayerStore((s) => s.logout)

  const [runs, setRuns]       = useState<RunRow[]>([])
  const [loadingRuns, setLR]  = useState(true)

  useEffect(() => {
    if (!session) return
    getRunHistory(session.userId, 10).then(({ data }) => {
      setRuns(data)
      setLR(false)
    })
  }, [session])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 20, padding: 0, fontFamily: FONT }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Perfil</h1>
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
        {/* Player card */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDk})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            👤
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{profile?.username ?? '…'}</p>
            <p style={{ margin: '4px 0 0', color: C.dim, fontSize: 13 }}>Nivel {profile?.level ?? 1}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard label="Puntuación total" value={(wallet?.totalScore ?? 0).toLocaleString()} />
          <StatCard label="Monedas"          value={(wallet?.currentCoins ?? 0).toLocaleString()} />
          {(wallet?.premiumGems ?? 0) > 0 && (
            <StatCard label="Gemas" value={(wallet!.premiumGems).toLocaleString()} />
          )}
        </div>

        {/* Recent runs */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.dim }}>Últimas partidas</p>
          {loadingRuns && <p style={{ color: C.dim, fontSize: 13 }}>Cargando…</p>}
          {!loadingRuns && runs.length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Aún no has jugado ninguna partida</p>}
          {!loadingRuns && runs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {runs.map((r) => <RunRow key={r.id} run={r} />)}
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: 8,
            padding: '13px',
            background: 'rgba(255,107,107,0.1)',
            border: `1px solid rgba(255,107,107,0.3)`,
            borderRadius: 10,
            color: C.error,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '14px 10px' }}>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.gold }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: C.dim }}>{label}</p>
    </div>
  )
}

function RunRow({ run }: { run: RunRow }) {
  const date = new Date(run.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  const dur  = run.durationSeconds >= 60
    ? `${Math.floor(run.durationSeconds / 60)}m ${run.durationSeconds % 60}s`
    : `${run.durationSeconds}s`

  return (
    <div style={{ ...cardStyle, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.gold }}>{run.scoreGained.toLocaleString()} pts</p>
        <p style={{ margin: '3px 0 0', color: C.dim, fontSize: 12 }}>
          🪙 {run.coinsCollected} · 🔥 ×{run.maxCombo} · ⏱ {dur}
        </p>
      </div>
      <p style={{ margin: 0, color: C.dim, fontSize: 12 }}>{date}</p>
    </div>
  )
}

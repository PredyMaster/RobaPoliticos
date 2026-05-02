import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { getMissionsForUser, claimMissionReward } from '../services/local/missions'
import type { MissionWithProgress, MissionType } from '../game/types/economy'
import { C, FONT, cardStyle } from './shared/theme'

type Tab = MissionType

const TABS: { type: Tab; label: string }[] = [
  { type: 'daily',       label: 'Diarias' },
  { type: 'weekly',      label: 'Semanales' },
  { type: 'achievement', label: 'Logros' },
]

export function MissionsScreen() {
  const navigate     = useNavigate()
  const session      = usePlayerStore((s) => s.session)
  const refreshWallet = usePlayerStore((s) => s.refreshWallet)

  const [tab,      setTab]     = useState<Tab>('daily')
  const [missions, setMissions] = useState<MissionWithProgress[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [reward,   setReward]   = useState<{ coins: number; gems: number } | null>(null)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    getMissionsForUser(session.userId).then(({ data, error }) => {
      if (error) setError(error)
      else setMissions(data)
      setLoading(false)
    })
  }, [session])

  async function handleClaim(missionId: string) {
    const result = await claimMissionReward(missionId)
    if (result.ok) {
      setMissions((prev) => prev.map((m) => m.id === missionId ? { ...m, claimed: true } : m))
      setReward({ coins: result.rewardCoins, gems: result.rewardGems })
      await refreshWallet()
      setTimeout(() => setReward(null), 3000)
    }
  }

  const filtered = missions.filter((m) => m.missionType === tab)

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 20, padding: 0, fontFamily: FONT }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Misiones</h1>
      </header>

      {/* Reward toast */}
      {reward && (
        <div style={{ margin: '12px 16px 0', padding: '12px 16px', background: 'rgba(74,222,128,0.15)', border: `1px solid ${C.success}`, borderRadius: 10, textAlign: 'center' }}>
          <p style={{ margin: 0, color: C.success, fontWeight: 700 }}>
            ¡Recompensa reclamada! 🪙 {reward.coins}{reward.gems > 0 ? ` · 💎 ${reward.gems}` : ''}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 6 }}>
        {TABS.map((t) => {
          const pending = missions.filter((m) => m.missionType === t.type && m.completed && !m.claimed).length
          return (
            <button
              key={t.type}
              onClick={() => setTab(t.type)}
              style={{
                flex: 1,
                padding: '9px 4px',
                background: tab === t.type ? C.gold : C.card,
                border: `1px solid ${tab === t.type ? C.gold : C.border}`,
                borderRadius: 8,
                color: tab === t.type ? '#1a1a2e' : '#fff',
                fontSize: 12,
                fontWeight: tab === t.type ? 700 : 400,
                cursor: 'pointer',
                fontFamily: FONT,
                position: 'relative',
              }}
            >
              {t.label}
              {pending > 0 && (
                <span style={{ marginLeft: 4, background: C.error, color: '#fff', borderRadius: '50%', fontSize: 10, padding: '1px 5px', fontWeight: 700 }}>
                  {pending}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px 28px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <p style={{ color: C.dim, textAlign: 'center', marginTop: 40 }}>Cargando misiones…</p>}
        {!loading && error && <p style={{ color: C.error, textAlign: 'center', marginTop: 40 }}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={{ color: C.dim, textAlign: 'center', marginTop: 40 }}>No hay misiones en esta categoría</p>
        )}
        {!loading && !error && filtered.map((m) => (
          <MissionCard key={m.id} mission={m} onClaim={() => handleClaim(m.id)} />
        ))}
      </div>
    </div>
  )
}

function MissionCard({ mission: m, onClaim }: { mission: MissionWithProgress; onClaim: () => void }) {
  const pct = Math.min(1, m.goal > 0 ? m.progress / m.goal : 0)

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: m.completed && !m.claimed ? C.gold : m.claimed ? C.success : C.border,
        opacity: m.claimed ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{m.name}</p>
          <p style={{ margin: '3px 0 0', color: C.dim, fontSize: 12 }}>{m.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {m.rewardCoins > 0 && <p style={{ margin: 0, color: C.gold, fontSize: 13, fontWeight: 600 }}>🪙 {m.rewardCoins}</p>}
          {m.rewardGems > 0  && <p style={{ margin: 0, color: C.info, fontSize: 13, fontWeight: 600 }}>💎 {m.rewardGems}</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ color: C.dim, fontSize: 11 }}>{m.progress.toLocaleString()} / {m.goal.toLocaleString()}</span>
          <span style={{ color: C.dim, fontSize: 11 }}>{Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: m.completed ? C.gold : C.info, borderRadius: 3, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Claim button */}
      {m.completed && !m.claimed && (
        <button
          onClick={onClaim}
          style={{
            width: '100%', padding: '10px',
            background: C.gold, border: 'none', borderRadius: 8,
            color: '#1a1a2e', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: FONT,
          }}
        >
          🎁 Reclamar recompensa
        </button>
      )}
      {m.claimed && (
        <p style={{ margin: 0, textAlign: 'center', color: C.success, fontSize: 13 }}>✓ Reclamado</p>
      )}
    </div>
  )
}

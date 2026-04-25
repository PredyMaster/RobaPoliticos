import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { getLeaderboard } from '../services/supabase/leaderboard'
import type { LeaderboardEntry, RankingType } from '../game/types/player'
import { C, FONT, cardStyle } from './shared/theme'

const TABS: { type: RankingType; label: string }[] = [
  { type: 'global',    label: 'Global' },
  { type: 'weekly',    label: 'Semanal' },
  { type: 'daily',     label: 'Diario' },
  { type: 'max_combo', label: 'Combo' },
]

export function RankingScreen() {
  const navigate   = useNavigate()
  const session    = usePlayerStore((s) => s.session)

  const [tab,     setTab]     = useState<RankingType>('global')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getLeaderboard(tab, session?.userId ?? null).then(({ data, error }) => {
      if (error) setError(error)
      else setEntries(data)
      setLoading(false)
    })
  }, [tab, session?.userId])

  const tabLabel = TABS.find((t) => t.type === tab)?.label ?? ''
  const scoreLabel = tab === 'max_combo' ? 'Combo' : 'Puntos'

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 20, padding: 0, fontFamily: FONT }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ranking</h1>
      </header>

      {/* Tab selector */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 6 }}>
        {TABS.map((t) => (
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
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px 28px', flex: 1, overflowY: 'auto' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: C.dim, marginTop: 40 }}>Cargando {tabLabel}…</p>
        )}
        {!loading && error && (
          <p style={{ textAlign: 'center', color: C.error, marginTop: 40 }}>{error}</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p style={{ textAlign: 'center', color: C.dim, marginTop: 40 }}>Sin datos aún</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 40px', gap: 8, padding: '0 4px 6px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.dim, fontSize: 11 }}>#</span>
              <span style={{ color: C.dim, fontSize: 11 }}>Jugador</span>
              <span style={{ color: C.dim, fontSize: 11, textAlign: 'right' }}>{scoreLabel}</span>
              <span style={{ color: C.dim, fontSize: 11, textAlign: 'right' }}>Nv.</span>
            </div>

            {entries.map((entry) => (
              <RankRow key={entry.userId} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RankRow({ entry }: { entry: LeaderboardEntry }) {
  const isMe = entry.isCurrentPlayer
  const medalMap: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const medal = medalMap[entry.rank] ?? `${entry.rank}`

  return (
    <div
      style={{
        ...cardStyle,
        display: 'grid',
        gridTemplateColumns: '32px 1fr 80px 40px',
        gap: 8,
        alignItems: 'center',
        padding: '10px 12px',
        borderColor: isMe ? C.gold : C.border,
        background: isMe ? 'rgba(244,197,66,0.08)' : C.card,
      }}
    >
      <span style={{ fontSize: entry.rank <= 3 ? 18 : 13, textAlign: 'center', color: entry.rank <= 3 ? undefined : C.dim }}>{medal}</span>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: isMe ? 700 : 400, color: isMe ? C.gold : '#fff' }}>
          {entry.username}
          {isMe && <span style={{ fontSize: 10, marginLeft: 6, color: C.gold }}>← tú</span>}
        </p>
      </div>
      <p style={{ margin: 0, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#fff' }}>
        {entry.score.toLocaleString()}
      </p>
      <p style={{ margin: 0, textAlign: 'right', fontSize: 13, color: C.dim }}>
        {entry.level}
      </p>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { C, FONT, cardStyle } from './shared/theme'

export function EndRunScreen() {
  const navigate        = useNavigate()
  const run             = useGameStore((s) => s.lastRunResult)
  const submit          = useGameStore((s) => s.lastSubmitResult)
  const isSubmitting    = useGameStore((s) => s.isSubmitting)

  if (!run) {
    return (
      <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#fff' }}>
        <p style={{ color: C.dim, fontSize: 15 }}>Sin datos de partida</p>
        <button onClick={() => navigate('/home')} style={actionBtn}>← Volver al menú</button>
      </div>
    )
  }

  const duration = run.durationSeconds >= 60
    ? `${Math.floor(run.durationSeconds / 60)}m ${run.durationSeconds % 60}s`
    : `${run.durationSeconds}s`

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div
        style={{
          padding: '24px 20px 20px',
          background: `linear-gradient(to bottom, ${C.bgDeep}, ${C.bg})`,
          textAlign: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <p style={{ margin: '0 0 6px', color: C.dim, fontSize: 13 }}>Partida finalizada</p>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, color: C.gold }}>
          {run.scoreGained.toLocaleString()}
        </h1>
        <p style={{ margin: '4px 0 0', color: C.dim, fontSize: 13 }}>puntos ganados</p>

        {isSubmitting && <p style={{ marginTop: 10, color: C.info, fontSize: 13 }}>Guardando resultado…</p>}
        {!isSubmitting && submit?.ok && (
          <p style={{ marginTop: 10, color: C.success, fontSize: 13 }}>
            ✓ Total: {submit.newTotalScore.toLocaleString()} pts · Nivel {submit.newLevel}
          </p>
        )}
        {!isSubmitting && submit && !submit.ok && (
          <p style={{ marginTop: 10, color: C.error, fontSize: 12 }}>
            {submit.error === 'suspicious_run' ? '⚠ Partida marcada como sospechosa' : `Error: ${submit.error}`}
          </p>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Monedas recogidas" value={run.coinsCollected.toLocaleString()} icon="🪙" />
        <StatCard label="Monedas perdidas"  value={run.coinsLost.toLocaleString()} icon="💨" />
        <StatCard label="Golpes"            value={run.hits.toLocaleString()} icon="👊" />
        <StatCard label="Golpes críticos"   value={run.criticalHits.toLocaleString()} icon="💥" />
        <StatCard label="Combo máximo"      value={`×${run.maxCombo}`} icon="🔥" />
        <StatCard label="Duración"          value={duration} icon="⏱" />
      </div>

      {/* ── Actions ── */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <button onClick={() => navigate('/game')}    style={actionBtnPrimary}>▶ Jugar de nuevo</button>
        <button onClick={() => navigate('/shop')}    style={actionBtn}>🛒 Ir a la tienda</button>
        <button onClick={() => navigate('/ranking')} style={actionBtn}>🏆 Ver ranking</button>
        <button onClick={() => navigate('/home')}    style={actionBtnGhost}>← Menú principal</button>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 22 }}>{icon}</p>
      <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 800, color: C.gold }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: C.dim }}>{label}</p>
    </div>
  )
}

const actionBtnPrimary: React.CSSProperties = {
  padding: '15px',
  background: C.gold,
  border: 'none',
  borderRadius: 10,
  color: '#1a1a2e',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONT,
}

const actionBtn: React.CSSProperties = {
  padding: '13px',
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: FONT,
}

const actionBtnGhost: React.CSSProperties = {
  padding: '10px',
  background: 'none',
  border: 'none',
  color: C.dim,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: FONT,
}

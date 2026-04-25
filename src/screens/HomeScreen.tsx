import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { useInventoryStore } from '../store/useInventoryStore'
import { WEAPONS_MAP } from '../game/data/weapons'
import { BOXES_MAP } from '../game/data/boxes'
import { C, FONT, cardStyle } from './shared/theme'

const NAV = [
  { label: '🛒 Tienda',   path: '/shop' },
  { label: '🏆 Ranking',  path: '/ranking' },
  { label: '🎯 Misiones', path: '/missions' },
  { label: '👤 Perfil',   path: '/profile' },
  { label: '⚙ Ajustes',  path: '/settings' },
]

export function HomeScreen() {
  const navigate  = useNavigate()
  const profile   = usePlayerStore((s) => s.profile)
  const wallet    = usePlayerStore((s) => s.wallet)
  const equipment = useInventoryStore((s) => s.equipment)

  const weapon = equipment ? (WEAPONS_MAP.get(equipment.equippedWeaponId) ?? null) : null
  const box    = equipment ? (BOXES_MAP.get(equipment.equippedBoxId) ?? null) : null

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: C.bg,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <h1 style={{ margin: 0, color: C.gold, fontSize: 18, fontWeight: 800 }}>Roba Políticos</h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 14 }}>
          <span>🪙 {(wallet?.currentCoins ?? 0).toLocaleString()}</span>
          {(wallet?.premiumGems ?? 0) > 0 && <span>💎 {wallet!.premiumGems}</span>}
        </div>
      </header>

      {/* ── Player card ── */}
      <div style={{ ...cardStyle, margin: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDk})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            👤
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{profile?.username ?? '…'}</p>
            <p style={{ margin: '3px 0 0', color: C.dim, fontSize: 13 }}>
              Nivel {profile?.level ?? 1} · {(wallet?.totalScore ?? 0).toLocaleString()} pts
            </p>
          </div>
        </div>
      </div>

      {/* ── Play button ── */}
      <div style={{ padding: '16px' }}>
        <button
          onClick={() => navigate('/game')}
          style={{
            width: '100%',
            padding: '18px',
            background: C.gold,
            border: 'none',
            borderRadius: 14,
            color: '#1a1a2e',
            fontSize: 22,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: FONT,
            letterSpacing: '0.06em',
          }}
        >
          ▶ JUGAR
        </button>
      </div>

      {/* ── Equipped items ── */}
      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <EquipCard
          label="Arma equipada"
          name={weapon?.name ?? '—'}
          detail={weapon ? `${weapon.coinsPerHit} monedas/golpe` : 'Sin equipar'}
        />
        <EquipCard
          label="Caja equipada"
          name={box?.name ?? '—'}
          detail={box ? `×${box.multiplier} multiplicador` : 'Sin equipar'}
        />
      </div>

      {/* ── Nav grid ── */}
      <div
        style={{
          padding: '0 16px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginTop: 'auto',
        }}
      >
        {NAV.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: '14px 6px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: FONT,
              minHeight: 54,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function EquipCard({ label, name, detail }: { label: string; name: string; detail: string }) {
  return (
    <div style={{ ...cardStyle, padding: '12px 14px' }}>
      <p style={{ margin: 0, color: C.dim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 14 }}>{name}</p>
      <p style={{ margin: '3px 0 0', color: C.gold, fontSize: 12 }}>{detail}</p>
    </div>
  )
}

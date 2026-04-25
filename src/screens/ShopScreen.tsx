import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventoryStore } from '../store/useInventoryStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { WEAPONS } from '../game/data/weapons'
import { BOXES } from '../game/data/boxes'
import type { Weapon, BoxItem } from '../game/types/game'
import type { ShopItemStatus } from '../game/types/economy'
import { C, FONT, cardStyle } from './shared/theme'

type Tab = 'weapons' | 'boxes'

// ── Shop screen ───────────────────────────────────────────────

export function ShopScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('weapons')
  const wallet = usePlayerStore((s) => s.wallet)

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 20, padding: 0, fontFamily: FONT }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tienda</h1>
        <span style={{ marginLeft: 'auto', color: C.gold, fontSize: 15, fontWeight: 600 }}>
          🪙 {(wallet?.currentCoins ?? 0).toLocaleString()}
        </span>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 8 }}>
        <TabBtn active={tab === 'weapons'} onClick={() => setTab('weapons')}>⚔ Armas</TabBtn>
        <TabBtn active={tab === 'boxes'}   onClick={() => setTab('boxes')}>📦 Cajas</TabBtn>
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px 28px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
        {tab === 'weapons'
          ? WEAPONS.map((w) => <WeaponCard key={w.id} weapon={w} />)
          : BOXES.map((b)   => <BoxCard   key={b.id} box={b} />)
        }
      </div>
    </div>
  )
}

// ── Internal components ───────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px',
        background: active ? C.gold : C.card,
        border: `1px solid ${active ? C.gold : C.border}`,
        borderRadius: 8,
        color: active ? '#1a1a2e' : '#fff',
        fontSize: 14, fontWeight: active ? 700 : 400,
        cursor: 'pointer', fontFamily: FONT,
      }}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }: { status: ShopItemStatus }) {
  const map: Record<ShopItemStatus, { text: string; color: string }> = {
    equipped:  { text: '✓ Equipado', color: C.gold },
    owned:     { text: 'Comprado',   color: C.success },
    available: { text: 'Disponible', color: C.dim },
    locked:    { text: '🔒 Bloq.',   color: C.dim },
  }
  const { text, color } = map[status]
  return <span style={{ fontSize: 12, color, fontWeight: 600 }}>{text}</span>
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: C.faint, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
      <p style={{ margin: 0, color: C.gold, fontSize: 13, fontWeight: 700 }}>{value}</p>
      <p style={{ margin: '2px 0 0', color: C.dim, fontSize: 10 }}>{label}</p>
    </div>
  )
}

function useItemStatus(itemType: 'weapon' | 'box', itemId: string, unlockLevel: number): ShopItemStatus {
  const equipment = useInventoryStore((s) => s.equipment)
  const ownsItem  = useInventoryStore((s) => s.ownsItem)
  const level     = usePlayerStore((s) => s.profile?.level ?? 1)

  const equippedId = itemType === 'weapon' ? equipment?.equippedWeaponId : equipment?.equippedBoxId
  if (equippedId === itemId) return 'equipped'
  if (ownsItem(itemType, itemId)) return 'owned'
  if (level < unlockLevel) return 'locked'
  return 'available'
}

// ── Weapon card ───────────────────────────────────────────────

function WeaponCard({ weapon }: { weapon: Weapon }) {
  const [busy, setBusy]         = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const status   = useItemStatus('weapon', weapon.id, weapon.unlockLevel)
  const purchase = useInventoryStore((s) => s.purchase)
  const equip    = useInventoryStore((s) => s.equip)
  const coins    = usePlayerStore((s) => s.wallet?.currentCoins ?? 0)

  const canBuy = status === 'available' && coins >= weapon.price

  async function handlePurchase() {
    setBusy(true); setFeedback(null)
    const r = await purchase('weapon', weapon.id)
    setFeedback(r.ok ? '✓ ¡Comprado!' : `Error: ${r.error}`)
    setBusy(false)
  }

  async function handleEquip() {
    setBusy(true); setFeedback(null)
    const r = await equip('weapon', weapon.id)
    if (!r.ok) setFeedback(`Error: ${r.error}`)
    setBusy(false)
  }

  return (
    <div style={{ ...cardStyle, borderColor: status === 'equipped' ? C.gold : C.border }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{weapon.name}</p>
          <p style={{ margin: '3px 0 0', color: C.dim, fontSize: 12 }}>{weapon.description}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <Stat label="Monedas/golpe" value={weapon.coinsPerHit} />
        <Stat label="Fuerza"        value={weapon.force} />
        <Stat label="Crítico"       value={`${(weapon.criticalChance * 100).toFixed(0)}%`} />
        <Stat label="CD (s)"        value={weapon.cooldown} />
      </div>

      {feedback && (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: feedback.startsWith('✓') ? C.success : C.error }}>
          {feedback}
        </p>
      )}

      <ActionRow
        status={status}
        busy={busy}
        price={weapon.price}
        canBuy={canBuy}
        onPurchase={handlePurchase}
        onEquip={handleEquip}
        unlockLevel={weapon.unlockLevel}
      />
    </div>
  )
}

// ── Box card ──────────────────────────────────────────────────

function BoxCard({ box }: { box: BoxItem }) {
  const [busy, setBusy]         = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const status   = useItemStatus('box', box.id, box.unlockLevel)
  const purchase = useInventoryStore((s) => s.purchase)
  const equip    = useInventoryStore((s) => s.equip)
  const coins    = usePlayerStore((s) => s.wallet?.currentCoins ?? 0)

  const canBuy = status === 'available' && coins >= box.price

  async function handlePurchase() {
    setBusy(true); setFeedback(null)
    const r = await purchase('box', box.id)
    setFeedback(r.ok ? '✓ ¡Comprado!' : `Error: ${r.error}`)
    setBusy(false)
  }

  async function handleEquip() {
    setBusy(true); setFeedback(null)
    const r = await equip('box', box.id)
    if (!r.ok) setFeedback(`Error: ${r.error}`)
    setBusy(false)
  }

  return (
    <div style={{ ...cardStyle, borderColor: status === 'equipped' ? C.gold : C.border }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{box.name}</p>
          <p style={{ margin: '3px 0 0', color: C.dim, fontSize: 12 }}>{box.description}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <Stat label="Multiplicador" value={`×${box.multiplier}`} />
        <Stat label="Velocidad"     value={box.speed} />
        <Stat label="Imán (px)"     value={box.magnetPower > 0 ? box.magnetPower : '—'} />
        <Stat label="Ancho"         value={box.width} />
      </div>

      {feedback && (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: feedback.startsWith('✓') ? C.success : C.error }}>
          {feedback}
        </p>
      )}

      <ActionRow
        status={status}
        busy={busy}
        price={box.price}
        canBuy={canBuy}
        onPurchase={handlePurchase}
        onEquip={handleEquip}
        unlockLevel={box.unlockLevel}
      />
    </div>
  )
}

// ── Action row (shared) ───────────────────────────────────────

function ActionRow({
  status,
  busy,
  price,
  canBuy,
  onPurchase,
  onEquip,
  unlockLevel,
}: {
  status: ShopItemStatus
  busy: boolean
  price: number
  canBuy: boolean
  onPurchase: () => void
  onEquip: () => void
  unlockLevel: number
}) {
  if (status === 'equipped') {
    return <p style={{ margin: 0, textAlign: 'center', color: C.gold, fontSize: 13, padding: '8px 0' }}>✓ Equipado actualmente</p>
  }
  if (status === 'locked') {
    return <p style={{ margin: 0, textAlign: 'center', color: C.dim, fontSize: 13, padding: '8px 0' }}>🔒 Requiere nivel {unlockLevel}</p>
  }
  if (status === 'owned') {
    return (
      <button
        onClick={onEquip}
        disabled={busy}
        style={{ width: '100%', padding: '10px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: FONT }}
      >
        {busy ? '…' : 'Equipar'}
      </button>
    )
  }
  return (
    <button
      onClick={onPurchase}
      disabled={!canBuy || busy}
      style={{
        width: '100%', padding: '10px',
        background: canBuy ? C.gold : 'rgba(255,255,255,0.08)',
        border: 'none', borderRadius: 8,
        color: canBuy ? '#1a1a2e' : C.dim,
        fontWeight: 700, fontSize: 13,
        cursor: canBuy && !busy ? 'pointer' : 'not-allowed',
        fontFamily: FONT,
      }}
    >
      {busy ? '…' : price === 0 ? 'Gratis' : `🪙 ${price.toLocaleString()}`}
    </button>
  )
}

export const C = {
  bg:      '#1a1a2e',
  bgDeep:  '#0f0f1e',
  card:    'rgba(255,255,255,0.05)',
  cardHi:  'rgba(255,255,255,0.09)',
  gold:    '#f4c542',
  goldDk:  '#c49b10',
  border:  'rgba(255,255,255,0.1)',
  dim:     'rgba(255,255,255,0.5)',
  faint:   'rgba(255,255,255,0.07)',
  error:   '#ff6b6b',
  success: '#4ade80',
  info:    '#60a5fa',
  overlay: 'rgba(0,0,0,0.78)',
} as const

export const FONT = 'system-ui, -apple-system, sans-serif'

// Shared style fragments (not full CSSProperties objects, just reused parts)
export const cardStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '14px 16px',
}

export const btnPrimary: React.CSSProperties = {
  background: C.gold,
  border: 'none',
  borderRadius: 10,
  color: '#1a1a2e',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONT,
}

export const btnSecondary: React.CSSProperties = {
  background: C.faint,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: '#fff',
  cursor: 'pointer',
  fontFamily: FONT,
}

export const btnGhost: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: FONT,
}

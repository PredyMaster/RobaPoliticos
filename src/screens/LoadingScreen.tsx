import { useEffect, useState } from 'react'
import { C, FONT } from './shared/theme'

const SPIN = `@keyframes rp-spin { to { transform: rotate(360deg); } }`

const MESSAGES = [
  'Cargando monedas…',
  'Preparando el escenario…',
  'Cargando el ranking…',
  'Buscando políticos…',
  'Afinando la piñata…',
  'Verificando inventario…',
]

export function LoadingScreen() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{SPIN}</style>
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.bg,
          gap: 28,
          fontFamily: FONT,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.gold, letterSpacing: '0.03em' }}>
          💰 Roba Políticos
        </h1>
        <div
          style={{
            width: 44,
            height: 44,
            border: '4px solid rgba(255,255,255,0.12)',
            borderTop: `4px solid ${C.gold}`,
            borderRadius: '50%',
            animation: 'rp-spin 0.8s linear infinite',
          }}
        />
        <span
          style={{ color: C.dim, fontSize: 14, letterSpacing: '0.03em', minHeight: 20, transition: 'opacity 0.3s' }}
        >
          {MESSAGES[idx]}
        </span>
      </div>
    </>
  )
}

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { C, FONT } from './shared/theme'

// ── HUD ──────────────────────────────────────────────────────

function GameHUD() {
  const runScore = useGameStore((s) => s.runScore)
  const runCoins = useGameStore((s) => s.runCoins)
  const pauseRun = useGameStore((s) => s.pauseRun)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
        fontFamily: FONT,
      }}
    >
      <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>🪙 {runCoins}</span>
      <span style={{ color: C.gold, fontSize: 28, fontWeight: 800 }}>{runScore.toLocaleString()}</span>
      <button
        onClick={pauseRun}
        style={{
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff',
          padding: '6px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 16,
          fontFamily: FONT,
          minWidth: 44,
          minHeight: 36,
        }}
      >
        II
      </button>
    </div>
  )
}

// ── Toggle row helper ─────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
      }}
    >
      <span style={{ color: '#fff', fontSize: 14, fontFamily: FONT }}>{label}</span>
      <div
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 12,
          background: value ? C.gold : 'rgba(255,255,255,0.2)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </div>
  )
}

// ── Pause overlay ─────────────────────────────────────────────

function PauseOverlay({ onResume, onExit }: { onResume: () => void; onExit: () => void }) {
  const musicEnabled     = useGameStore((s) => s.musicEnabled)
  const sfxEnabled       = useGameStore((s) => s.sfxEnabled)
  const vibrationEnabled = useGameStore((s) => s.vibrationEnabled)
  const setMusic         = useGameStore((s) => s.setMusicEnabled)
  const setSfx           = useGameStore((s) => s.setSfxEnabled)
  const setVibration     = useGameStore((s) => s.setVibrationEnabled)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        zIndex: 100,
        fontFamily: FONT,
      }}
    >
      <h2 style={{ color: C.gold, fontSize: 28, margin: '0 0 24px', fontWeight: 800 }}>Pausa</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, width: 260 }}>
        <ToggleRow label="🎵 Música"     value={musicEnabled}     onChange={setMusic} />
        <ToggleRow label="🔊 Efectos"    value={sfxEnabled}       onChange={setSfx} />
        <ToggleRow label="📳 Vibración"  value={vibrationEnabled} onChange={setVibration} />
      </div>

      <button
        onClick={onResume}
        style={{
          width: 260,
          padding: '14px',
          background: C.gold,
          border: 'none',
          borderRadius: 10,
          color: '#1a1a2e',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: FONT,
          marginBottom: 10,
        }}
      >
        ▶ Continuar
      </button>

      <button
        onClick={onExit}
        style={{
          width: 260,
          padding: '12px',
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          color: '#fff',
          fontSize: 15,
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        ✕ Salir al menú
      </button>
    </div>
  )
}

// ── GameScreen ────────────────────────────────────────────────

export function GameScreen() {
  const navigate    = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const isRunActive = useGameStore((s) => s.isRunActive)
  const isPaused    = useGameStore((s) => s.isPaused)
  const startRun    = useGameStore((s) => s.startRun)
  const resumeRun   = useGameStore((s) => s.resumeRun)

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {/* Phaser se montará aquí en la Fase 11 */}
      <div
        ref={containerRef}
        id="phaser-container"
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {!isRunActive && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>Canvas Phaser — Fase 11</p>
            <button
              onClick={startRun}
              style={{
                padding: '16px 48px',
                background: C.gold,
                border: 'none',
                borderRadius: 12,
                color: '#1a1a2e',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              ▶ Iniciar Partida
            </button>
            <button
              onClick={() => navigate('/home')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
            >
              ← Volver al menú
            </button>
          </div>
        )}
      </div>

      {isRunActive && <GameHUD />}

      {isPaused && <PauseOverlay onResume={resumeRun} onExit={() => navigate('/home')} />}
    </div>
  )
}

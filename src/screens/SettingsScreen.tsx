import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { useInventoryStore } from '../store/useInventoryStore'
import type { GraphicsQuality } from '../game/types/game'
import { C, FONT, cardStyle } from './shared/theme'

export function SettingsScreen() {
  const navigate = useNavigate()

  const musicEnabled     = useGameStore((s) => s.musicEnabled)
  const sfxEnabled       = useGameStore((s) => s.sfxEnabled)
  const vibrationEnabled = useGameStore((s) => s.vibrationEnabled)
  const quality          = useGameStore((s) => s.quality)
  const setMusic         = useGameStore((s) => s.setMusicEnabled)
  const setSfx           = useGameStore((s) => s.setSfxEnabled)
  const setVibration     = useGameStore((s) => s.setVibrationEnabled)
  const setQuality       = useGameStore((s) => s.setQuality)

  const language         = usePlayerStore((s) => s.preferences.language)
  const setPreferences   = usePlayerStore((s) => s.setPreferences)
  const resetProgress    = usePlayerStore((s) => s.resetProgress)
  const loadInventory    = useInventoryStore((s) => s.loadInventory)

  const QUALITY_OPTS: GraphicsQuality[] = ['low', 'medium', 'high']
  const QUALITY_LABELS: Record<GraphicsQuality, string> = { low: 'Baja', medium: 'Media', high: 'Alta' }

  const LANG_OPTS = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ]

  async function handleResetProgress() {
    const confirmed = window.confirm('Esto borrará tu progreso local y no se podrá deshacer. ¿Quieres continuar?')
    if (!confirmed) return

    await resetProgress()
    const nextSession = usePlayerStore.getState().session
    if (nextSession) await loadInventory(nextSession.userId)
    navigate('/home', { replace: true })
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 20, padding: 0, fontFamily: FONT }}>←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ajustes</h1>
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {/* Audio */}
        <Section title="Audio">
          <ToggleRow label="🎵 Música"     value={musicEnabled}     onChange={setMusic} />
          <ToggleRow label="🔊 Efectos de sonido" value={sfxEnabled} onChange={setSfx} />
        </Section>

        {/* Dispositivo */}
        <Section title="Dispositivo">
          <ToggleRow label="📳 Vibración"  value={vibrationEnabled} onChange={setVibration} />
        </Section>

        {/* Calidad gráfica */}
        <Section title="Calidad gráfica">
          <div style={{ display: 'flex', gap: 8 }}>
            {QUALITY_OPTS.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: quality === q ? C.gold : C.card,
                  border: `1px solid ${quality === q ? C.gold : C.border}`,
                  borderRadius: 8,
                  color: quality === q ? '#1a1a2e' : '#fff',
                  fontSize: 13,
                  fontWeight: quality === q ? 700 : 400,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                {QUALITY_LABELS[q]}
              </button>
            ))}
          </div>
        </Section>

        {/* Idioma */}
        <Section title="Idioma">
          <div style={{ display: 'flex', gap: 8 }}>
            {LANG_OPTS.map((l) => (
              <button
                key={l.code}
                onClick={() => setPreferences({ language: l.code })}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: language === l.code ? C.gold : C.card,
                  border: `1px solid ${language === l.code ? C.gold : C.border}`,
                  borderRadius: 8,
                  color: language === l.code ? '#1a1a2e' : '#fff',
                  fontSize: 13,
                  fontWeight: language === l.code ? 700 : 400,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Datos locales */}
        <Section title="Datos locales">
          <button
            onClick={handleResetProgress}
            style={{
              width: '100%',
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
            Reiniciar progreso local
          </button>
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...legalBtn }} disabled>Política de privacidad</button>
            <button style={{ ...legalBtn }} disabled>Términos de uso</button>
          </div>
          <p style={{ margin: '8px 0 0', color: C.dim, fontSize: 11, textAlign: 'center' }}>
            Roba Políticos v0.1.0 · © 2025 The MindHub Company
          </p>
        </Section>
      </div>
    </div>
  )
}

// ── Internal helpers ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </p>
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <div
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
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
            top: 4,
            left: value ? 22 : 4,
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

const legalBtn: React.CSSProperties = {
  flex: 1,
  padding: '9px 6px',
  background: C.faint,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.dim,
  fontSize: 12,
  cursor: 'not-allowed',
  fontFamily: FONT,
}

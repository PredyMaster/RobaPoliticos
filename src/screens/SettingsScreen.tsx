import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { Placeholder } from './shared/Placeholder'

export function SettingsScreen() {
  const navigate       = useNavigate()
  const musicEnabled   = useGameStore((s) => s.musicEnabled)
  const sfxEnabled     = useGameStore((s) => s.sfxEnabled)
  const quality        = useGameStore((s) => s.quality)
  const setMusic       = useGameStore((s) => s.setMusicEnabled)
  const setSfx         = useGameStore((s) => s.setSfxEnabled)
  const setQuality     = useGameStore((s) => s.setQuality)

  return (
    <Placeholder
      title="Ajustes"
      subtitle={`Música: ${musicEnabled ? 'ON' : 'OFF'} · SFX: ${sfxEnabled ? 'ON' : 'OFF'} · Calidad: ${quality}`}
      actions={[
        { label: `Música: ${musicEnabled ? 'ON → OFF' : 'OFF → ON'}`, onClick: () => setMusic(!musicEnabled) },
        { label: `SFX: ${sfxEnabled ? 'ON → OFF' : 'OFF → ON'}`,      onClick: () => setSfx(!sfxEnabled) },
        { label: `Calidad: ${quality} → ${quality === 'high' ? 'medium' : quality === 'medium' ? 'low' : 'high'}`,
          onClick: () => setQuality(quality === 'high' ? 'medium' : quality === 'medium' ? 'low' : 'high') },
        { label: '← Volver', onClick: () => navigate('/home') },
      ]}
    />
  )
}

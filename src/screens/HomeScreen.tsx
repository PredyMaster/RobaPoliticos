import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { Placeholder } from './shared/Placeholder'

export function HomeScreen() {
  const navigate = useNavigate()
  const profile  = usePlayerStore((s) => s.profile)
  const wallet   = usePlayerStore((s) => s.wallet)

  const subtitle = profile
    ? `Hola, ${profile.username} · ${wallet?.coins ?? 0} monedas`
    : 'Cargando perfil…'

  return (
    <Placeholder
      title="Roba Políticos"
      subtitle={subtitle}
      actions={[
        { label: '▶ Jugar',       onClick: () => navigate('/game') },
        { label: '🛒 Tienda',     onClick: () => navigate('/shop') },
        { label: '🏆 Ranking',    onClick: () => navigate('/ranking') },
        { label: '🎯 Misiones',   onClick: () => navigate('/missions') },
        { label: '👤 Perfil',     onClick: () => navigate('/profile') },
        { label: '⚙ Ajustes',    onClick: () => navigate('/settings') },
      ]}
    />
  )
}

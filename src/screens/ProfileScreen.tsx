import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/usePlayerStore'
import { Placeholder } from './shared/Placeholder'

export function ProfileScreen() {
  const navigate = useNavigate()
  const profile  = usePlayerStore((s) => s.profile)
  const wallet   = usePlayerStore((s) => s.wallet)
  const logout   = usePlayerStore((s) => s.logout)

  const subtitle = profile
    ? `Nv.${profile.level} · ${profile.totalScore} pts · ${wallet?.coins ?? 0} monedas`
    : 'Cargando…'

  return (
    <Placeholder
      title="Perfil"
      subtitle={subtitle}
      actions={[
        { label: '← Volver',      onClick: () => navigate('/home') },
        { label: 'Cerrar sesión', onClick: async () => { await logout(); navigate('/login', { replace: true }) } },
      ]}
    />
  )
}

import { useNavigate } from 'react-router-dom'
import { Placeholder } from './shared/Placeholder'

export function GameScreen() {
  const navigate = useNavigate()

  return (
    <Placeholder
      title="Partida"
      subtitle="Canvas de Phaser — Phase 11"
      actions={[
        { label: '← Volver',      onClick: () => navigate('/home') },
        { label: 'Fin de partida (test)', onClick: () => navigate('/end-run') },
      ]}
    />
  )
}

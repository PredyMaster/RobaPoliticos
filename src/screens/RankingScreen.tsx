import { useNavigate } from 'react-router-dom'
import { Placeholder } from './shared/Placeholder'

export function RankingScreen() {
  const navigate = useNavigate()

  return (
    <Placeholder
      title="Ranking"
      subtitle="Global · Semanal · Diario — Phase 9"
      actions={[{ label: '← Volver', onClick: () => navigate('/home') }]}
    />
  )
}

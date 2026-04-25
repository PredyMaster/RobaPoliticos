import { useNavigate } from 'react-router-dom'
import { Placeholder } from './shared/Placeholder'

export function MissionsScreen() {
  const navigate = useNavigate()

  return (
    <Placeholder
      title="Misiones"
      subtitle="Diarias · Semanales · Permanentes — Phase 9"
      actions={[{ label: '← Volver', onClick: () => navigate('/home') }]}
    />
  )
}

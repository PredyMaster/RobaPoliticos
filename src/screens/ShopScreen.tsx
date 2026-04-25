import { useNavigate } from 'react-router-dom'
import { Placeholder } from './shared/Placeholder'

export function ShopScreen() {
  const navigate = useNavigate()

  return (
    <Placeholder
      title="Tienda"
      subtitle="Armas y cajas — Phase 9"
      actions={[{ label: '← Volver', onClick: () => navigate('/home') }]}
    />
  )
}

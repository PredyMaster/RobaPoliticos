import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { Placeholder } from './shared/Placeholder'

export function EndRunScreen() {
  const navigate = useNavigate()
  const lastRunResult  = useGameStore((s) => s.lastRunResult)
  const lastSubmitResult = useGameStore((s) => s.lastSubmitResult)
  const isSubmitting   = useGameStore((s) => s.isSubmitting)

  const info = isSubmitting
    ? 'Enviando resultado…'
    : lastSubmitResult?.ok
      ? `+${lastRunResult?.scoreGained ?? 0} pts · ${lastRunResult?.coinsCollected ?? 0} monedas`
      : lastSubmitResult?.error ?? 'Error al guardar'

  return (
    <Placeholder
      title="Fin de partida"
      subtitle={info}
      actions={[
        { label: 'Volver al inicio', onClick: () => navigate('/home') },
        { label: 'Jugar de nuevo',   onClick: () => navigate('/game') },
      ]}
    />
  )
}

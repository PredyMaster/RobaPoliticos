import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StandaloneGame } from './StandaloneGame'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <StandaloneGame />
  </StrictMode>,
)

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useAuth } from './AuthProvider'
import { LoadingScreen } from '../screens/LoadingScreen'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  const session = usePlayerStore((s) => s.session)

  if (isLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

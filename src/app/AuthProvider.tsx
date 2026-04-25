import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useGameStore } from '../store/useGameStore'
import { useInventoryStore } from '../store/useInventoryStore'
import { onAuthStateChange } from '../services/supabase/auth'

type AuthContextValue = {
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ isLoading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const loadPlayer     = usePlayerStore((s) => s.loadPlayer)
  const syncPreferences = useGameStore((s) => s.syncPreferences)
  const isLoadingSession = usePlayerStore((s) => s.isLoadingSession)

  useEffect(() => {
    const boot = () =>
      loadPlayer().then(() => {
        syncPreferences()
        const { session } = usePlayerStore.getState()
        if (session) useInventoryStore.getState().loadInventory(session.userId)
      })

    boot()

    const unsubscribe = onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') boot()
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ isLoading: isLoadingSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

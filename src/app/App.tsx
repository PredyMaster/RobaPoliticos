import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { HomeScreen } from '../screens/HomeScreen'
import { GameScreen } from '../screens/GameScreen'
import { ShopScreen } from '../screens/ShopScreen'
import { RankingScreen } from '../screens/RankingScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { MissionsScreen } from '../screens/MissionsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { EndRunScreen } from '../screens/EndRunScreen'
import { LoadingScreen } from '../screens/LoadingScreen'
import { usePlayerStore } from '../store/usePlayerStore'
import { useGameStore } from '../store/useGameStore'
import { useInventoryStore } from '../store/useInventoryStore'

export default function App() {
  const loadPlayer = usePlayerStore((s) => s.loadPlayer)
  const isLoadingSession = usePlayerStore((s) => s.isLoadingSession)
  const syncPreferences = useGameStore((s) => s.syncPreferences)
  const loadInventory = useInventoryStore((s) => s.loadInventory)

  useEffect(() => {
    loadPlayer().then(() => {
      syncPreferences()
      const { session } = usePlayerStore.getState()
      if (session) void loadInventory(session.userId)
    })
  }, [loadInventory, loadPlayer, syncPreferences])

  if (isLoadingSession) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/ranking" element={<RankingScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/missions" element={<MissionsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/end-run" element={<EndRunScreen />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

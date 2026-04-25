import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginScreen }    from '../screens/LoginScreen'
import { HomeScreen }     from '../screens/HomeScreen'
import { GameScreen }     from '../screens/GameScreen'
import { ShopScreen }     from '../screens/ShopScreen'
import { RankingScreen }  from '../screens/RankingScreen'
import { ProfileScreen }  from '../screens/ProfileScreen'
import { MissionsScreen } from '../screens/MissionsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { EndRunScreen }   from '../screens/EndRunScreen'

function P({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login"    element={<LoginScreen />} />

          {/* Protegidas */}
          <Route path="/home"     element={<P><HomeScreen /></P>} />
          <Route path="/game"     element={<P><GameScreen /></P>} />
          <Route path="/shop"     element={<P><ShopScreen /></P>} />
          <Route path="/ranking"  element={<P><RankingScreen /></P>} />
          <Route path="/profile"  element={<P><ProfileScreen /></P>} />
          <Route path="/missions" element={<P><MissionsScreen /></P>} />
          <Route path="/settings" element={<P><SettingsScreen /></P>} />
          <Route path="/end-run"  element={<P><EndRunScreen /></P>} />

          {/* Fallbacks */}
          <Route path="/"  element={<Navigate to="/home" replace />} />
          <Route path="*"  element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

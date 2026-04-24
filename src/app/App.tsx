import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ color: '#fff', background: '#1a1a2e', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              Roba Políticos — Bootstrap OK
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

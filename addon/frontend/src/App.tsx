import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ZonesPage from './pages/ZonesPage'
import ValvesPage from './pages/ValvesPage'
import SensorsPage from './pages/SensorsPage'
import SchedulePage from './pages/SchedulePage'
import WeatherPage from './pages/WeatherPage'
import HistoryPage from './pages/HistoryPage'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  useWebSocket()

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/valves" element={<ValvesPage />} />
          <Route path="/sensors" element={<SensorsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </Suspense>
  )
}

export default App

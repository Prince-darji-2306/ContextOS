import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './pages/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import MemoryBrowser from './pages/MemoryBrowser'
import MemoryGraph from './pages/MemoryGraph'
import ApiKeysPage from './pages/ApiKeysPage'
import ConnectedAppsPage from './pages/ConnectedAppsPage'
import AgentActivityPage from './pages/AgentActivityPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="memories" element={<MemoryBrowser />} />
        <Route path="graph" element={<MemoryGraph />} />
        <Route path="keys" element={<ApiKeysPage />} />
        <Route path="apps" element={<ConnectedAppsPage />} />
        <Route path="agents" element={<AgentActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

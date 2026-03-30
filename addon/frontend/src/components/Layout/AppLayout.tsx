import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import HeaderBar from './HeaderBar'
import { useIrrigationStore } from '../../store/irrigationStore'
import { INGRESS_BASE } from '../../lib/ingressBase'

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useIrrigationStore(s => s.theme)
  const { i18n } = useTranslation()

  // Apply dark class to <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Fetch backend-configured language on mount (config wins over default)
  useEffect(() => {
    fetch(`${INGRESS_BASE}/api/config`)
      .then(r => r.json())
      .then(cfg => {
        if (cfg.language && !localStorage.getItem('irrigation-lang-override')) {
          i18n.changeLanguage(cfg.language)
        }
      })
      .catch(() => {})
  }, [i18n])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <HeaderBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

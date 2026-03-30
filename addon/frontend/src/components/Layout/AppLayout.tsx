import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import HeaderBar from './HeaderBar'
import { useIrrigationStore } from '../../store/irrigationStore'
import { INGRESS_BASE } from '../../lib/ingressBase'

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useIrrigationStore(s => s.theme)
  const sidebarOpen = useIrrigationStore(s => s.sidebarOpen)
  const closeSidebar = useIrrigationStore(s => s.closeSidebar)
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    localStorage.removeItem('irrigation-lang-override')
    fetch(`${INGRESS_BASE}/api/config`)
      .then(r => r.json())
      .then(cfg => {
        if (cfg.language) {
          i18n.changeLanguage(cfg.language)
        }
      })
      .catch(() => {})
  }, [i18n])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — always visible on desktop, slide-in on mobile */}
      <div className={[
        'fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <HeaderBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import HeaderBar from './HeaderBar'
import { useIrrigationStore, applyThemeColors, DEFAULT_COLORS, type ThemeColors } from '../../store/irrigationStore'
import { INGRESS_BASE } from '../../lib/ingressBase'
import { settingsApi } from '../../api/settings'

const COLOR_KEYS: (keyof ThemeColors)[] = ['primary', 'primaryDark', 'bg', 'surface', 'border', 'textSecondary']
const SETTING_KEYS = ['theme_color_primary', 'theme_color_primary_dark', 'theme_color_bg', 'theme_color_surface', 'theme_color_border', 'theme_color_text_secondary']

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useIrrigationStore(s => s.theme)
  const sidebarOpen = useIrrigationStore(s => s.sidebarOpen)
  const closeSidebar = useIrrigationStore(s => s.closeSidebar)
  const setThemeColors = useIrrigationStore(s => s.setThemeColors)
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    fetch(`${INGRESS_BASE}/api/config`)
      .then(r => r.json())
      .then(cfg => {
        if (cfg.language) i18n.changeLanguage(cfg.language)
      })
      .catch(() => {})
  }, [i18n])

  useEffect(() => {
    settingsApi.getAll().then(cfg => {
      const colors: Partial<ThemeColors> = {}
      COLOR_KEYS.forEach((key, i) => {
        const val = cfg[SETTING_KEYS[i]]
        if (val) colors[key] = val
      })
      if (Object.keys(colors).length > 0) {
        setThemeColors(colors)
      } else {
        applyThemeColors(DEFAULT_COLORS)
      }
    }).catch(() => { applyThemeColors(DEFAULT_COLORS) })
  }, [setThemeColors])

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

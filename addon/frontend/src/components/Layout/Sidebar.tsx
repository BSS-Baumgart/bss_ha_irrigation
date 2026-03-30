import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Layers, Zap, Radio, CalendarDays,
  Cloud, History, Sun, Moon, X,
} from 'lucide-react'
import clsx from 'clsx'
import { useIrrigationStore } from '../../store/irrigationStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/zones',     icon: Layers,          label: 'nav.zones' },
  { to: '/valves',    icon: Zap,             label: 'nav.valves' },
  { to: '/sensors',   icon: Radio,           label: 'nav.sensors' },
  { to: '/schedule',  icon: CalendarDays,    label: 'nav.schedule' },
  { to: '/weather',   icon: Cloud,           label: 'nav.weather' },
  { to: '/history',   icon: History,         label: 'nav.history' },
]

const LANGS = [
  { code: 'pl', label: 'PL' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
]

export default function Sidebar() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme, closeSidebar } = useIrrigationStore()

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('irrigation-lang-override', code)
  }

  return (
    <aside className="w-56 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <img src="icon.png" alt="" className="w-6 h-6 rounded" />
        <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">Irrigation BSS</span>
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary-900 text-primary-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              )
            }
          >
            <Icon size={16} />
            {t(label)}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <div className="flex gap-1">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => changeLang(code)}
              className={clsx(
                'flex-1 text-xs py-1 rounded font-medium transition-colors',
                i18n.language === code
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}

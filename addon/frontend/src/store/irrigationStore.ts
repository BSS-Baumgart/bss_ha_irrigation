import { create } from 'zustand'
import type { ActiveZone, Sensor } from '../types'

type Theme = 'dark' | 'light'

export interface ThemeColors {
  primary: string
  primaryDark: string
  bg: string
  surface: string
  border: string
  textSecondary: string
}

export const DEFAULT_COLORS: ThemeColors = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  bg: '#030712',
  surface: '#111827',
  border: '#1f2937',
  textSecondary: '#9ca3af',
}

export function applyThemeColors(colors: Partial<ThemeColors>) {
  const root = document.documentElement
  if (colors.primary) root.style.setProperty('--theme-primary', colors.primary)
  if (colors.primaryDark) root.style.setProperty('--theme-primary-dark', colors.primaryDark)
  if (colors.bg) root.style.setProperty('--theme-bg', colors.bg)
  if (colors.surface) root.style.setProperty('--theme-surface', colors.surface)
  if (colors.border) root.style.setProperty('--theme-border', colors.border)
  if (colors.textSecondary) root.style.setProperty('--theme-text-secondary', colors.textSecondary)
}

interface IrrigationStore {
  activeZones: ActiveZone[]
  anyWatering: boolean
  blockingSensors: Sensor[]
  wsConnected: boolean
  theme: Theme
  sidebarOpen: boolean
  themeColors: ThemeColors
  setActiveZones: (zones: ActiveZone[]) => void
  setBlockingSensors: (sensors: Sensor[]) => void
  setWsConnected: (v: boolean) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
  setThemeColors: (colors: Partial<ThemeColors>) => void
}

const savedTheme = (localStorage.getItem('irrigation-theme') as Theme) || 'dark'

export const useIrrigationStore = create<IrrigationStore>((set, get) => ({
  activeZones: [],
  anyWatering: false,
  blockingSensors: [],
  wsConnected: false,
  theme: savedTheme,
  sidebarOpen: false,
  themeColors: { ...DEFAULT_COLORS },
  setActiveZones: (zones) => set({ activeZones: zones, anyWatering: zones.length > 0 }),
  setBlockingSensors: (sensors) => set({ blockingSensors: sensors }),
  setWsConnected: (v) => set({ wsConnected: v }),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('irrigation-theme', next)
    set({ theme: next })
  },
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  setThemeColors: (colors) => {
    const merged = { ...get().themeColors, ...colors }
    applyThemeColors(merged)
    set({ themeColors: merged })
  },
}))

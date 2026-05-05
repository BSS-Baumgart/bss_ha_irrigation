import { create } from 'zustand'
import type { ActiveZone, Sensor } from '../types'

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

function hexToRgba(hex: string, alpha: number): string {
  try {
    const clean = hex.replace('#', '')
    const full6 = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
    const r = parseInt(full6.slice(0, 2), 16)
    const g = parseInt(full6.slice(2, 4), 16)
    const b = parseInt(full6.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(34,197,94,${alpha})`
  }
}

export function applyThemeColors(colors: Partial<ThemeColors>) {
  const full: ThemeColors = { ...DEFAULT_COLORS, ...colors }
  const root = document.documentElement
  root.style.setProperty('--theme-primary', full.primary)
  root.style.setProperty('--theme-primary-dark', full.primaryDark)
  root.style.setProperty('--theme-bg', full.bg)
  root.style.setProperty('--theme-surface', full.surface)
  root.style.setProperty('--theme-border', full.border)
  root.style.setProperty('--theme-text-secondary', full.textSecondary)
  root.style.setProperty('--theme-primary-a15', hexToRgba(full.primary, 0.15))
  root.style.setProperty('--theme-primary-a20', hexToRgba(full.primary, 0.20))
}

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
  sidebarOpen: boolean
  themeColors: ThemeColors
  setActiveZones: (zones: ActiveZone[]) => void
  setBlockingSensors: (sensors: Sensor[]) => void
  setWsConnected: (v: boolean) => void
  toggleSidebar: () => void
  closeSidebar: () => void
  setThemeColors: (colors: Partial<ThemeColors>) => void
}

export const useIrrigationStore = create<IrrigationStore>((set, get) => ({
  activeZones: [],
  anyWatering: false,
  blockingSensors: [],
  wsConnected: false,
  sidebarOpen: false,
  themeColors: { ...DEFAULT_COLORS },
  setActiveZones: (zones) => set({ activeZones: zones, anyWatering: zones.length > 0 }),
  setBlockingSensors: (sensors) => set({ blockingSensors: sensors }),
  setWsConnected: (v) => set({ wsConnected: v }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  setThemeColors: (colors) => {
    const merged = { ...get().themeColors, ...colors }
    applyThemeColors(merged)
    set({ themeColors: merged })
  },
}))

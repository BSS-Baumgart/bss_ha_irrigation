import { create } from 'zustand'
import type { ActiveZone, Sensor } from '../types'

type Theme = 'dark' | 'light'

interface IrrigationStore {
  activeZones: ActiveZone[]
  anyWatering: boolean
  blockingSensors: Sensor[]
  wsConnected: boolean
  theme: Theme
  setActiveZones: (zones: ActiveZone[]) => void
  setBlockingSensors: (sensors: Sensor[]) => void
  setWsConnected: (v: boolean) => void
  toggleTheme: () => void
}

const savedTheme = (localStorage.getItem('irrigation-theme') as Theme) || 'dark'

export const useIrrigationStore = create<IrrigationStore>((set, get) => ({
  activeZones: [],
  anyWatering: false,
  blockingSensors: [],
  wsConnected: false,
  theme: savedTheme,
  setActiveZones: (zones) => set({ activeZones: zones, anyWatering: zones.length > 0 }),
  setBlockingSensors: (sensors) => set({ blockingSensors: sensors }),
  setWsConnected: (v) => set({ wsConnected: v }),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('irrigation-theme', next)
    set({ theme: next })
  },
}))

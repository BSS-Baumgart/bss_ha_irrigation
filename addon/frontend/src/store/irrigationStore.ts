import { create } from 'zustand'
import type { ActiveZone, Sensor } from '../types'

interface IrrigationStore {
  activeZones: ActiveZone[]
  anyWatering: boolean
  blockingSensors: Sensor[]
  wsConnected: boolean
  setActiveZones: (zones: ActiveZone[]) => void
  setBlockingSensors: (sensors: Sensor[]) => void
  setWsConnected: (v: boolean) => void
}

export const useIrrigationStore = create<IrrigationStore>((set) => ({
  activeZones: [],
  anyWatering: false,
  blockingSensors: [],
  wsConnected: false,
  setActiveZones: (zones) => set({ activeZones: zones, anyWatering: zones.length > 0 }),
  setBlockingSensors: (sensors) => set({ blockingSensors: sensors }),
  setWsConnected: (v) => set({ wsConnected: v }),
}))

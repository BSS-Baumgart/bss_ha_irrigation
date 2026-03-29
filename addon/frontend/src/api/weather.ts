import client from './client'
import type { WeatherData, HAEntity } from '../types'

export const weatherApi = {
  get: async (entityId?: string, lat?: number, lon?: number) => {
    const params: Record<string, unknown> = {}
    if (entityId) params.entity_id = entityId
    if (lat !== undefined) params.lat = lat
    if (lon !== undefined) params.lon = lon
    const r = await client.get<WeatherData>('/api/weather', { params })
    return r.data
  },
}

export const haEntitiesApi = {
  all: async (domain?: string, search?: string) => {
    const params: Record<string, unknown> = {}
    if (domain) params.domain = domain
    if (search) params.search = search
    const r = await client.get<HAEntity[]>('/api/ha/entities', { params })
    return r.data
  },
  valves: () => client.get<HAEntity[]>('/api/ha/entities/valves').then(r => r.data),
  sensors: () => client.get<HAEntity[]>('/api/ha/entities/sensors').then(r => r.data),
  weather: () => client.get<HAEntity[]>('/api/ha/entities/weather').then(r => r.data),
}

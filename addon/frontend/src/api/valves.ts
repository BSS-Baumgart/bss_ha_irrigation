import client from './client'
import type { Valve } from '../types'

export const valvesApi = {
  list: () => client.get<Valve[]>('/api/valves').then(r => r.data),
  get: (id: number) => client.get<Valve>(`/api/valves/${id}`).then(r => r.data),
  create: (data: Partial<Valve>) => client.post<Valve>('/api/valves', data).then(r => r.data),
  update: (id: number, data: Partial<Valve>) => client.patch<Valve>(`/api/valves/${id}`, data).then(r => r.data),
  remove: (id: number) => client.delete(`/api/valves/${id}`),
}

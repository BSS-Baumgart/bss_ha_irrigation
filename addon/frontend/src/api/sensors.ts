import client from './client'
import type { Sensor } from '../types'

export const sensorsApi = {
  list: () => client.get<Sensor[]>('/api/sensors').then(r => r.data),
  create: (data: Partial<Sensor>) => client.post<Sensor>('/api/sensors', data).then(r => r.data),
  update: (id: number, data: Partial<Sensor>) => client.patch<Sensor>(`/api/sensors/${id}`, data).then(r => r.data),
  remove: (id: number) => client.delete(`/api/sensors/${id}`),
}

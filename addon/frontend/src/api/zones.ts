import client from './client'
import type { Zone } from '../types'

export const zonesApi = {
  list: () => client.get<Zone[]>('/api/zones').then(r => r.data),
  get: (id: number) => client.get<Zone>(`/api/zones/${id}`).then(r => r.data),
  create: (data: Partial<Zone>) => client.post<Zone>('/api/zones', data).then(r => r.data),
  update: (id: number, data: Partial<Zone>) => client.patch<Zone>(`/api/zones/${id}`, data).then(r => r.data),
  remove: (id: number) => client.delete(`/api/zones/${id}`),
}

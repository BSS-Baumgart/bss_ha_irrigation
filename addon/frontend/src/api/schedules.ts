import client from './client'
import type { Schedule } from '../types'

export const schedulesApi = {
  list: () => client.get<Schedule[]>('/api/schedules').then(r => r.data),
  create: (data: Partial<Schedule>) => client.post<Schedule>('/api/schedules', data).then(r => r.data),
  update: (id: number, data: Partial<Schedule>) => client.patch<Schedule>(`/api/schedules/${id}`, data).then(r => r.data),
  remove: (id: number) => client.delete(`/api/schedules/${id}`),
}

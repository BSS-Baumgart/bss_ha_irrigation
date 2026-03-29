import client from './client'
import type { IrrigationStatus } from '../types'

export const irrigationApi = {
  status: () => client.get<IrrigationStatus>('/api/irrigation/status').then(r => r.data),
  start: (zoneId: number, durationMin?: number) =>
    client.post(`/api/irrigation/start/${zoneId}`, { duration_min: durationMin }).then(r => r.data),
  stop: (zoneId: number) =>
    client.post(`/api/irrigation/stop/${zoneId}`).then(r => r.data),
  stopAll: () => client.post('/api/irrigation/stop-all').then(r => r.data),
}

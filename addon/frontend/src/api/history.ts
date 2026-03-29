import client from './client'
import type { WateringLog } from '../types'

export const historyApi = {
  list: (zoneId?: number, limit = 50, offset = 0) => {
    const params: Record<string, unknown> = { limit, offset }
    if (zoneId !== undefined) params.zone_id = zoneId
    return client.get<WateringLog[]>('/api/history', { params }).then(r => r.data)
  },
  clear: (zoneId?: number) => {
    const params = zoneId !== undefined ? { zone_id: zoneId } : {}
    return client.delete('/api/history', { params })
  },
}

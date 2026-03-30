import client from './client'

export const settingsApi = {
  getAll: () => client.get<Record<string, string | null>>('/api/settings').then(r => r.data),
  set: (key: string, value: string | null) =>
    client.put(`/api/settings/${key}`, { value }).then(r => r.data),
}

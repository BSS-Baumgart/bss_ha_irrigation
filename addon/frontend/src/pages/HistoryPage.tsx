import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { History, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { historyApi } from '../api/history'
import { zonesApi } from '../api/zones'
import type { WateringLog, Zone } from '../types'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatusBadge from '../components/common/StatusBadge'

function formatDuration(sec?: number) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}m ${s}s`
}

/** Parse date string treating bare ISO strings (no tz indicator) as UTC. */
function parseUtcDate(value: string): Date {
  if (!value) return new Date(NaN)
  const normalized = value.endsWith('Z') || value.includes('+') ? value : value + 'Z'
  return new Date(normalized)
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<WateringLog[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [zoneFilter, setZoneFilter] = useState<number | undefined>()
  const [confirmClear, setConfirmClear] = useState(false)

  const load = () => historyApi.list(zoneFilter, 100).then(setLogs).finally(() => setLoading(false))
  useEffect(() => { load() }, [zoneFilter])
  useEffect(() => { zonesApi.list().then(setZones) }, [])

  const clear = async () => {
    await historyApi.clear(zoneFilter); await load(); setConfirmClear(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('history.title')}</h1>
        <div className="flex gap-3 items-center">
          <select className="input py-1.5 text-sm w-48" value={zoneFilter ?? ''}
            onChange={e => setZoneFilter(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">{t('history.allZones')}</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          {logs.length > 0 && (
            <button onClick={() => setConfirmClear(true)}
              className="btn-danger btn-sm flex items-center gap-2">
              <Trash2 size={13} />{t('history.clearHistory')}
            </button>
          )}
        </div>
      </div>

      {loading ? <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      : logs.length === 0 ? (
        <div className="card text-center py-14 text-gray-600">
          <History size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs">
                <th className="text-left px-4 py-3">{t('history.startedAt')}</th>
                <th className="text-left px-4 py-3">{t('zones.title')}</th>
                <th className="text-left px-4 py-3">{t('history.duration')}</th>
                <th className="text-left px-4 py-3">{t('history.triggeredBy')}</th>
                <th className="text-left px-4 py-3">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {parseUtcDate(log.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{log.zone_name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">{formatDuration(log.duration_sec)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                      {t(`history.triggers.${log.triggered_by}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.skipped ? (
                      <div className="flex items-center gap-1.5">
                        <XCircle size={13} className="text-yellow-500" />
                        <span className="text-xs text-yellow-500">
                          {log.skip_reason ? t(`history.skipReasons.${log.skip_reason}`) : t('history.skipped')}
                        </span>
                      </div>
                    ) : log.ended_at ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={13} className="text-primary-500" />
                        <span className="text-xs text-primary-400">OK</span>
                      </div>
                    ) : (
                      <StatusBadge variant="green" pulse>Active</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={confirmClear} title={t('history.clearHistory')}
        message={t('history.clearConfirm')}
        onConfirm={clear} onCancel={() => setConfirmClear(false)} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, Layers, Zap, Radio, Play, Square, Clock, CalendarDays } from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'
import { zonesApi } from '../api/zones'
import { sensorsApi } from '../api/sensors'
import { schedulesApi } from '../api/schedules'
import { irrigationApi } from '../api/irrigation'
import type { Zone, Sensor, Schedule } from '../types'
import StatusBadge from '../components/common/StatusBadge'
import { useNavigate } from 'react-router-dom'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatNextRun(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  const diffH = Math.round((d.getTime() - now.getTime()) / 3600000)
  if (diffH < 1) return '< 1h'
  if (diffH < 24) return `${diffH}h`
  const days = Math.round(diffH / 24)
  return `${days}d`
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeZones, anyWatering } = useIrrigationStore()
  const [zones, setZones] = useState<Zone[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [startingZone, setStartingZone] = useState<number | null>(null)

  useEffect(() => {
    zonesApi.list().then(setZones).catch(() => {})
    sensorsApi.list().then(setSensors).catch(() => {})
    schedulesApi.list().then(setSchedules).catch(() => {})
  }, [])

  const blockingSensors = sensors.filter(s => s.is_blocking && s.enabled)
  const totalValves = zones.reduce((a, z) => a + z.valve_count, 0)

  const nextRunForZone = (zoneId: number): string | null => {
    const zoneSchedules = schedules.filter(s => s.zone_id === zoneId && s.enabled && s.next_run)
    if (!zoneSchedules.length) return null
    const sorted = [...zoneSchedules].sort((a, b) =>
      new Date(a.next_run!).getTime() - new Date(b.next_run!).getTime()
    )
    return formatNextRun(sorted[0].next_run)
  }

  const handleStart = async (zone: Zone) => {
    setStartingZone(zone.id)
    try {
      await irrigationApi.start(zone.id)
    } catch {}
    finally { setStartingZone(null) }
  }

  const handleStop = async (zoneId: number) => {
    try {
      await irrigationApi.stop(zoneId)
    } catch {}
  }

  const handleStopAll = async () => {
    try {
      await irrigationApi.stopAll()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.totalZones'), value: zones.length, icon: Layers, color: 'text-primary-400', to: '/zones' },
          { label: t('dashboard.totalValves'), value: totalValves, icon: Zap, color: 'text-blue-400', to: '/valves' },
          { label: t('nav.sensors'), value: sensors.length, icon: Radio, color: 'text-yellow-400', to: '/sensors' },
          { label: t('dashboard.activeZones'), value: activeZones.length, icon: Droplets, color: anyWatering ? 'text-primary-400' : 'text-gray-500', to: '/zones' },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <button key={label} onClick={() => navigate(to)}
            className="card hover:border-gray-700 transition-colors text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          </button>
        ))}
      </div>

      {blockingSensors.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ {t('dashboard.wateringBlocked')}</p>
          <div className="flex flex-wrap gap-2">
            {blockingSensors.map(s => (
              <StatusBadge key={s.id} variant="yellow">
                {t(`sensors.types.${s.sensor_type}`)} — {s.ha_state}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {anyWatering && (
        <div className="card border-primary-800">
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="text-primary-400 animate-pulse" size={18} />
            <span className="font-semibold text-primary-400">{t('header.watering')}</span>
            <button onClick={handleStopAll}
              className="ml-auto btn-danger btn-sm flex items-center gap-1.5">
              <Square size={11} fill="currentColor" />{t('header.stopAll')}
            </button>
          </div>
          <div className="space-y-3">
            {activeZones.map(z => (
              <div key={z.zone_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white">{z.zone_name}</span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatTime(z.remaining_sec)} left</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${Math.min(100, ((z.duration_min * 60 - z.remaining_sec) / (z.duration_min * 60)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {zones.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('nav.zones')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {zones.map(zone => {
              const isActive = activeZones.some(a => a.zone_id === zone.id)
              const activeInfo = activeZones.find(a => a.zone_id === zone.id)
              const nextRun = nextRunForZone(zone.id)
              return (
                <div key={zone.id}
                  className={`card transition-colors ${isActive ? 'border-primary-700' : 'hover:border-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                    <span className="font-semibold text-gray-900 dark:text-white truncate flex-1">{zone.name}</span>
                    {isActive && <StatusBadge variant="green" pulse>{t('zones.isWatering')}</StatusBadge>}
                  </div>

                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Zap size={11} />{zone.valve_count} {t('zones.valveCount').toLowerCase()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{zone.duration_min} min
                    </span>
                    {nextRun && (
                      <span className="flex items-center gap-1 text-primary-400">
                        <CalendarDays size={11} />{nextRun}
                      </span>
                    )}
                  </div>

                  {isActive && activeInfo && (
                    <div className="mb-3">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-1000 rounded-full"
                          style={{ width: `${Math.min(100, ((activeInfo.duration_min * 60 - activeInfo.remaining_sec) / (activeInfo.duration_min * 60)) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{formatTime(activeInfo.remaining_sec)} {t('dashboard.remaining')}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {isActive ? (
                      <button onClick={() => handleStop(zone.id)}
                        className="btn-danger btn-sm flex items-center gap-1.5">
                        <Square size={11} fill="currentColor" />{t('zones.stopZone')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStart(zone)}
                        disabled={!zone.enabled || zone.valve_count === 0 || startingZone === zone.id}
                        className="btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40">
                        <Play size={11} />{t('zones.startZone')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {zones.length === 0 && (
        <div className="card text-center py-14 text-gray-600">
          <Droplets size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-3">{t('dashboard.noZones')}</p>
          <button onClick={() => navigate('/zones')} className="btn-primary btn-sm">
            {t('zones.addZone')}
          </button>
        </div>
      )}
    </div>
  )
}

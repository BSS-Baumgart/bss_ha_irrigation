import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, Layers, Zap, Radio, Play, Square } from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'
import { zonesApi } from '../api/zones'
import { sensorsApi } from '../api/sensors'
import { irrigationApi } from '../api/irrigation'
import type { Zone, Sensor } from '../types'
import StatusBadge from '../components/common/StatusBadge'
import { useNavigate } from 'react-router-dom'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeZones, anyWatering } = useIrrigationStore()
  const [zones, setZones] = useState<Zone[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])

  useEffect(() => {
    zonesApi.list().then(setZones).catch(() => {})
    sensorsApi.list().then(setSensors).catch(() => {})
  }, [])

  const blockingSensors = sensors.filter(s => s.is_blocking && s.enabled)
  const enabledZones = zones.filter(z => z.enabled && z.valve_count > 0)
  const totalValves = zones.reduce((a, z) => a + z.valve_count, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>

      {/* Stats row */}
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

      {/* Blocking sensors alert */}
      {blockingSensors.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Watering is blocked by sensors:</p>
          <div className="flex flex-wrap gap-2">
            {blockingSensors.map(s => (
              <StatusBadge key={s.id} variant="yellow">
                {t(`sensors.types.${s.sensor_type}`)} — {s.ha_state}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* Active zones */}
      {anyWatering && (
        <div className="card border-primary-800">
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="text-primary-400 animate-pulse" size={18} />
            <span className="font-semibold text-primary-400">{t('header.watering')}</span>
            <button onClick={() => irrigationApi.stopAll()}
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

      {/* Quick start */}
      {enabledZones.length > 0 && (
        <div className="card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('dashboard.quickStart')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {enabledZones.map(zone => {
              const isActive = activeZones.some(a => a.zone_id === zone.id)
              return (
                <button key={zone.id}
                  onClick={() => isActive ? irrigationApi.stop(zone.id) : irrigationApi.start(zone.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    isActive
                      ? 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                  <span className="truncate">{zone.name}</span>
                  {isActive ? <Square size={11} className="shrink-0 ml-auto" fill="currentColor" /> : <Play size={11} className="shrink-0 ml-auto" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {zones.length === 0 && (
        <div className="card text-center py-14 text-gray-600">
          <Droplets size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-3">No zones configured yet.</p>
          <button onClick={() => navigate('/zones')} className="btn-primary btn-sm">
            {t('zones.addZone')}
          </button>
        </div>
      )}
    </div>
  )
}

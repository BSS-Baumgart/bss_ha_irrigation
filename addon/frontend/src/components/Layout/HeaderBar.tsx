import { useTranslation } from 'react-i18next'
import { Droplets, CloudRain, Square, Wifi, WifiOff } from 'lucide-react'
import { useIrrigationStore } from '../../store/irrigationStore'
import { irrigationApi } from '../../api/irrigation'
import clsx from 'clsx'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function HeaderBar() {
  const { t } = useTranslation()
  const { activeZones, anyWatering, blockingSensors, wsConnected } = useIrrigationStore()
  const isRaining = blockingSensors.some(s => s.sensor_type === 'rain' && s.is_blocking)

  const handleStopAll = async () => {
    await irrigationApi.stopAll()
  }

  return (
    <header className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4">
      {/* WS status dot */}
      <div className={clsx('w-2 h-2 rounded-full', wsConnected ? 'bg-primary-500' : 'bg-gray-600')} title={wsConnected ? 'Connected' : 'Disconnected'} />

      {/* Watering status */}
      <div className="flex items-center gap-2 flex-1">
        {anyWatering ? (
          <>
            <Droplets size={16} className="text-primary-400 animate-pulse" />
            <span className="text-primary-400 text-sm font-medium">{t('header.watering')}</span>
            {activeZones.slice(0, 2).map(z => (
              <span key={z.zone_id} className="badge-green">
                {z.zone_name} — {formatTime(z.remaining_sec)}
              </span>
            ))}
            {activeZones.length > 2 && (
              <span className="badge-gray">+{activeZones.length - 2}</span>
            )}
          </>
        ) : (
          <span className="text-gray-500 text-sm">{t('header.notWatering')}</span>
        )}
      </div>

      {/* Rain sensor indicator */}
      {isRaining && (
        <div className="flex items-center gap-1.5 text-blue-400 text-sm">
          <CloudRain size={15} />
          <span>{t('header.rainSensor')}</span>
        </div>
      )}

      {/* WS icon */}
      <div className="text-gray-600">
        {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      </div>

      {/* Stop all button */}
      {anyWatering && (
        <button
          onClick={handleStopAll}
          className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Square size={12} fill="currentColor" />
          {t('header.stopAll')}
        </button>
      )}
    </header>
  )
}

import { useTranslation } from 'react-i18next'
import { Droplets, CloudRain, Square, Wifi, WifiOff, Menu } from 'lucide-react'
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
  const { activeZones, anyWatering, blockingSensors, wsConnected, toggleSidebar } = useIrrigationStore()
  const isRaining = blockingSensors.some(s => s.sensor_type === 'rain' && s.is_blocking)

  const handleStopAll = async () => {
    await irrigationApi.stopAll()
  }

  return (
    <header className="h-14 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      {/* WS dot */}
      <div className={clsx('w-2 h-2 rounded-full shrink-0', wsConnected ? 'bg-primary-500' : 'bg-gray-400')} />

      {/* Watering status */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        {anyWatering ? (
          <>
            <Droplets size={16} className="text-primary-400 animate-pulse shrink-0" />
            <span className="text-primary-400 text-sm font-medium shrink-0 hidden sm:inline">{t('header.watering')}</span>
            {activeZones.slice(0, 2).map(z => (
              <span key={z.zone_id} className="badge-green truncate max-w-[120px]">
                {z.zone_name} — {formatTime(z.remaining_sec)}
              </span>
            ))}
            {activeZones.length > 2 && (
              <span className="badge-gray shrink-0">+{activeZones.length - 2}</span>
            )}
          </>
        ) : (
          <span className="text-gray-500 text-sm truncate">{t('header.notWatering')}</span>
        )}
      </div>

      {isRaining && (
        <div className="hidden sm:flex items-center gap-1.5 text-blue-400 text-sm shrink-0">
          <CloudRain size={15} />
          <span className="hidden md:inline">{t('header.rainSensor')}</span>
        </div>
      )}

      <div className="text-gray-400 shrink-0">
        {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      </div>

      {anyWatering && (
        <button
          onClick={handleStopAll}
          className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <Square size={12} fill="currentColor" />
          <span className="hidden sm:inline">{t('header.stopAll')}</span>
        </button>
      )}
    </header>
  )
}

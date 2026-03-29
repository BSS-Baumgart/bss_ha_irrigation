import { useTranslation } from 'react-i18next'
import { Droplets } from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { activeZones, anyWatering } = useIrrigationStore()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">{t('dashboard.title')}</h1>

      {anyWatering ? (
        <div className="card border-primary-700">
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="text-primary-400 animate-pulse" size={20} />
            <span className="font-semibold text-primary-400">{t('header.watering')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeZones.map(z => (
              <div key={z.zone_id} className="bg-gray-800 rounded-lg p-3">
                <div className="font-medium text-white">{z.zone_name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {Math.floor(z.remaining_sec / 60)}m {z.remaining_sec % 60}s {t('header.remaining')}
                </div>
                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-1000"
                    style={{ width: `${((z.duration_min * 60 - z.remaining_sec) / (z.duration_min * 60)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <Droplets size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('header.notWatering')}</p>
        </div>
      )}

      <p className="text-gray-600 text-sm">
        → {t('nav.zones')}, {t('nav.valves')}, {t('nav.sensors')}, {t('nav.schedule')} — coming in Stage 2
      </p>
    </div>
  )
}

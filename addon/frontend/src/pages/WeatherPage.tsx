import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, CloudRain, Thermometer, Droplets, RefreshCw } from 'lucide-react'
import { weatherApi } from '../api/weather'
import { haEntitiesApi } from '../api/weather'
import type { WeatherData, HAEntity } from '../types'

const CONDITION_ICONS: Record<string, string> = {
  sunny: '☀️', partlycloudy: '⛅', cloudy: '☁️', rainy: '🌧️',
  pouring: '🌧️', snowy: '❄️', 'lightning-rainy': '⛈️', unknown: '🌡️',
}

export default function WeatherPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [entityId, setEntityId] = useState('')
  const [entities, setEntities] = useState<HAEntity[]>([])
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [source, setSource] = useState<'ha' | 'openmeteo'>('ha')

  useEffect(() => {
    haEntitiesApi.weather().then(setEntities).catch(() => {})
    const saved = localStorage.getItem('irrigation-weather-entity')
    if (saved) { setEntityId(saved); setSource('ha') }
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const result = source === 'ha' && entityId
        ? await weatherApi.get(entityId)
        : await weatherApi.get(undefined, lat ? Number(lat) : undefined, lon ? Number(lon) : undefined)
      setData(result)
      if (source === 'ha' && entityId) localStorage.setItem('irrigation-weather-entity', entityId)
    } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [entityId, source])

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-white">{t('weather.title')}</h1>

      <div className="card space-y-4">
        <p className="text-sm font-medium text-gray-400">{t('weather.source')}</p>
        <div className="flex gap-3">
          <button onClick={() => setSource('ha')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${source === 'ha' ? 'bg-primary-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {t('weather.haEntity')}
          </button>
          <button onClick={() => setSource('openmeteo')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${source === 'openmeteo' ? 'bg-primary-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            Open-Meteo
          </button>
        </div>
        {source === 'ha' ? (
          <div>
            <label className="label">{t('weather.haEntity')}</label>
            <select className="input" value={entityId} onChange={e => setEntityId(e.target.value)}>
              <option value="">— select —</option>
              {entities.map(e => <option key={e.entity_id} value={e.entity_id}>{e.friendly_name}</option>)}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('weather.latitude')}</label>
              <input className="input" type="number" step="0.0001" placeholder="52.2297"
                value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('weather.longitude')}</label>
              <input className="input" type="number" step="0.0001" placeholder="21.0122"
                value={lon} onChange={e => setLon(e.target.value)} />
            </div>
          </div>
        )}
        <button onClick={refresh} disabled={loading}
          className="btn-secondary btn-sm flex items-center gap-2">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {data && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{CONDITION_ICONS[data.condition] ?? '🌡️'}</span>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {data.temperature !== null && data.temperature !== undefined ? `${data.temperature}°C` : '—'}
                  </div>
                  <div className="text-gray-400 text-sm">{t(`weather.conditions.${data.condition}`)}</div>
                </div>
              </div>
              {data.rain_expected_24h
                ? <div className="flex items-center gap-2 text-blue-400 bg-blue-900/30 px-3 py-2 rounded-lg">
                    <CloudRain size={16} /><span className="text-sm font-medium">{t('weather.rainExpected')}</span>
                  </div>
                : <div className="flex items-center gap-2 text-green-500 bg-green-900/20 px-3 py-2 rounded-lg">
                    <Cloud size={16} /><span className="text-sm">{t('weather.noRain')}</span>
                  </div>
              }
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Droplets size={14} />{data.precipitation_probability}% {t('weather.probability')}
              </div>
            </div>
          </div>

          {data.forecast.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium text-gray-400 mb-3">Forecast</p>
              <div className="grid grid-cols-4 gap-2">
                {data.forecast.slice(0, 8).map((f, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(f.datetime).getHours()}:00
                    </div>
                    <div className="text-lg">{CONDITION_ICONS[f.condition] ?? '🌡️'}</div>
                    <div className="text-xs text-white mt-1">{f.temperature !== undefined ? `${f.temperature}°` : '—'}</div>
                    <div className="text-xs text-blue-400">{f.precipitation_probability}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

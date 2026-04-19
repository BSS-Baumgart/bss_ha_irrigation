import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, X } from 'lucide-react'
import { haEntitiesApi } from '../../api/weather'
import type { HAEntity } from '../../types'
import clsx from 'clsx'

interface Props {
  value: string
  onChange: (entityId: string) => void
  type?: 'valves' | 'sensors' | 'weather' | 'all'
  placeholder?: string
  disabled?: boolean
}

export default function EntityPicker({ value, onChange, type = 'all', placeholder, disabled }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entities, setEntities] = useState<HAEntity[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = entities.find(e => e.entity_id === value)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const fetcher = type === 'valves' ? haEntitiesApi.valves
      : type === 'sensors' ? haEntitiesApi.sensors
      : type === 'weather' ? haEntitiesApi.weather
      : () => haEntitiesApi.all()
    fetcher().then(setEntities).catch(() => setEntities([])).finally(() => setLoading(false))
  }, [open, type])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = entities.filter(e =>
    e.entity_id.toLowerCase().includes(search.toLowerCase()) ||
    e.friendly_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'input flex items-center justify-between gap-2 text-left',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={clsx('flex-1 truncate', !selected && !value && 'text-gray-500')}>
          {selected
            ? <>{selected.friendly_name} <span className="text-gray-500 text-xs ml-1">{selected.entity_id}</span></>
            : (value || placeholder || t('valves.selectEntity'))
          }
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="p-0.5 hover:text-red-400 text-gray-500 rounded">
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} className={clsx('text-gray-500 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="input pl-7 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center text-gray-500 text-sm">{t('common.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm">{t('common.noData')}</div>
            ) : filtered.map(e => (
              <button
                key={e.entity_id}
                type="button"
                onClick={() => { onChange(e.entity_id); setOpen(false); setSearch('') }}
                className={clsx(
                  'w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center justify-between gap-2',
                  e.entity_id === value && 'bg-primary-900'
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{e.friendly_name}</div>
                  <div className="text-xs text-gray-500 truncate">{e.entity_id}</div>
                </div>
                <span className={clsx(
                  'text-xs shrink-0 px-1.5 py-0.5 rounded',
                  e.state === 'on' ? 'bg-primary-900 text-primary-400' :
                  e.state === 'off' ? 'bg-gray-800 text-gray-400' : 'bg-yellow-900 text-yellow-400'
                )}>{e.state}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Radio } from 'lucide-react'
import { sensorsApi } from '../api/sensors'
import type { Sensor, SensorType } from '../types'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatusBadge from '../components/common/StatusBadge'
import EntityPicker from '../components/common/EntityPicker'

const SENSOR_TYPES: SensorType[] = ['rain', 'soil', 'flow', 'temperature', 'weather']

const TYPE_ENTITY_MAP: Record<SensorType, 'sensors' | 'weather'> = {
  rain: 'sensors', soil: 'sensors', flow: 'sensors', temperature: 'sensors', weather: 'weather',
}

function formatSensorValue(sensor: Sensor, t: (k: string) => string) {
  const raw = String(sensor.ha_state ?? '').trim()
  if (!raw) return '—'

  const normalized = raw.toLowerCase()

  if (normalized === 'unknown' || normalized === 'unavailable' || normalized === 'none') {
    return t('common.unavailable')
  }

  if (sensor.sensor_type === 'weather') {
    const key = `weather.conditions.${normalized}`
    const translated = t(key)
    return translated === key ? raw : translated
  }

  if (normalized === 'on') return t('common.on')
  if (normalized === 'off') return t('common.off')

  const numeric = Number(raw.replace(',', '.'))
  if (!Number.isNaN(numeric)) {
    const nf1 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
    const nf2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
    if (sensor.sensor_type === 'temperature') return `${nf1.format(numeric)} °C`
    if (sensor.sensor_type === 'soil') return `${nf1.format(numeric)} %`
    if (sensor.sensor_type === 'flow') return nf2.format(numeric)
    return nf2.format(numeric)
  }

  return raw
}

function formatThreshold(sensor: Sensor) {
  if (sensor.threshold === undefined || sensor.threshold === null) return null
  const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
  if (sensor.sensor_type === 'temperature') return `${nf.format(sensor.threshold)} °C`
  if (sensor.sensor_type === 'soil') return `${nf.format(sensor.threshold)} %`
  return nf.format(sensor.threshold)
}

function SensorForm({ initial, onSave, onCancel }: {
  initial?: Partial<Sensor>
  onSave: (data: Partial<Sensor>) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Sensor>>({
    name: '', entity_id: '', sensor_type: 'rain', threshold: undefined, enabled: true, ...initial,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof Sensor, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('')
    try { await onSave(form) }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  const showThreshold = form.sensor_type === 'soil' || form.sensor_type === 'temperature'
  const thresholdLabel = form.sensor_type === 'soil' ? `${t('sensors.threshold')} (%)` : `${t('sensors.threshold')} (°C)`

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      {err && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      <div>
        <label className="label">{t('sensors.type')} *</label>
        <select className="input" value={form.sensor_type}
          onChange={e => set('sensor_type', e.target.value as SensorType)}>
          {SENSOR_TYPES.map(tp => <option key={tp} value={tp}>{t(`sensors.types.${tp}`)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('valves.entityId')} *</label>
        <EntityPicker value={form.entity_id || ''} onChange={v => set('entity_id', v)}
          type={TYPE_ENTITY_MAP[form.sensor_type as SensorType] ?? 'sensors'} />
      </div>
      <div>
        <label className="label">{t('common.name')} *</label>
        <input className="input" required value={form.name || ''} onChange={e => set('name', e.target.value)} />
      </div>
      {showThreshold && (
        <div>
          <label className="label">{thresholdLabel}</label>
          <input className="input" type="number" step="0.1"
            value={form.threshold ?? (form.sensor_type === 'soil' ? 80 : 2)}
            onChange={e => set('threshold', Number(e.target.value))} />
          <p className="text-xs text-gray-500 mt-1">
            {form.sensor_type === 'soil' ? 'Skip watering when soil moisture exceeds this value' : 'Freeze protection: block watering below this temperature'}
          </p>
        </div>
      )}
      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input resize-none" rows={2}
          value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="s-en" checked={!!form.enabled}
          onChange={e => set('enabled', e.target.checked)} className="w-4 h-4 accent-primary-500" />
        <label htmlFor="s-en" className="text-sm text-gray-700 dark:text-gray-300">{t('common.enabled')}</label>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">{t('common.cancel')}</button>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? '...' : t('common.save')}</button>
      </div>
    </form>
  )
}

export default function SensorsPage() {
  const { t } = useTranslation()
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Sensor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Sensor | null>(null)

  const load = () => sensorsApi.list().then(setSensors).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  useEffect(() => {
    const id = setInterval(() => sensorsApi.list().then(setSensors).catch(() => {}), 5000)
    return () => clearInterval(id)
  }, [])

  const save = async (data: Partial<Sensor>) => {
    if (selected) await sensorsApi.update(selected.id, data)
    else await sensorsApi.create(data)
    await load(); setModal(null)
  }

  const remove = async () => {
    if (!deleteTarget) return
    await sensorsApi.remove(deleteTarget.id); await load(); setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('sensors.title')}</h1>
        <button onClick={() => { setSelected(null); setModal('add') }} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={15} />{t('sensors.addSensor')}
        </button>
      </div>

      {loading ? <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      : sensors.length === 0 ? (
        <div className="card text-center py-14 text-gray-600">
          <Radio size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sensors.map(sensor => (
            <div key={sensor.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                      {t(`sensors.types.${sensor.sensor_type}`)}
                    </span>
                    {!sensor.enabled && <StatusBadge variant="gray">{t('common.disabled')}</StatusBadge>}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white truncate">{sensor.name}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{sensor.entity_id}</div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => { setSelected(sensor); setModal('edit') }}
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300"><Pencil size={12} /></button>
                  <button onClick={() => setDeleteTarget(sensor)}
                    className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm min-w-0 pr-2">
                  <span className="text-gray-500">{t('sensors.currentValue')}: </span>
                  <span className="text-gray-900 dark:text-white font-medium break-all">{formatSensorValue(sensor, t)}</span>
                  {formatThreshold(sensor) && (
                    <div className="text-xs text-gray-500 mt-1">{t('sensors.threshold')}: {formatThreshold(sensor)}</div>
                  )}
                </div>
                {sensor.is_blocking
                  ? <StatusBadge variant="red" pulse>{t('sensors.blocking')}</StatusBadge>
                  : <StatusBadge variant="green">{t('sensors.notBlocking')}</StatusBadge>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'add'} title={t('sensors.addSensor')} onClose={() => setModal(null)}>
        <SensorForm onSave={save} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'edit'} title={t('sensors.editSensor')} onClose={() => setModal(null)}>
        {selected && <SensorForm initial={selected} onSave={save} onCancel={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!deleteTarget} title={t('sensors.deleteSensor')}
        message={t('sensors.deleteConfirm', { name: deleteTarget?.name })}
        onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { schedulesApi } from '../api/schedules'
import { zonesApi } from '../api/zones'
import type { Schedule, Zone, WateringMode } from '../types'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatusBadge from '../components/common/StatusBadge'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_BITS = [0, 1, 2, 3, 4, 5, 6]

function weekdaysFromBitmask(mask: number): boolean[] {
  return DAY_BITS.map(i => !!(mask & (1 << i)))
}
function bitmaskFromWeekdays(days: boolean[]): number {
  return days.reduce((acc, v, i) => v ? acc | (1 << i) : acc, 0)
}

function ScheduleForm({ initial, zones, onSave, onCancel }: {
  initial?: Partial<Schedule>; zones: Zone[]
  onSave: (data: Partial<Schedule>) => Promise<void>; onCancel: () => void
}) {
  const { t } = useTranslation()

  // Resolve initial selected zone IDs (all_zone_ids from backend or just zone_id)
  const initialZoneIds: number[] = initial?.all_zone_ids?.length
    ? initial.all_zone_ids
    : initial?.zone_id ? [initial.zone_id] : (zones[0] ? [zones[0].id] : [])

  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>(initialZoneIds)
  const [form, setForm] = useState<Partial<Schedule>>({
    zone_id: initialZoneIds[0], weekdays: 0b1111111, start_time: '07:00',
    duration_override_min: undefined, mode: 'sequential', enabled: true,
    skip_if_rain: true, skip_if_soil_wet: true, skip_if_frost: true,
    ...initial,
  })
  const [days, setDays] = useState<boolean[]>(weekdaysFromBitmask(form.weekdays ?? 0b1111111))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof Schedule, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleDay = (i: number) => {
    const nd = [...days]; nd[i] = !nd[i]
    setDays(nd); set('weekdays', bitmaskFromWeekdays(nd))
  }

  const toggleZone = (zoneId: number) => {
    setSelectedZoneIds(prev => {
      if (prev.includes(zoneId)) {
        // At least one zone must be selected
        if (prev.length === 1) return prev
        return prev.filter(id => id !== zoneId)
      } else {
        return [...prev, zoneId]
      }
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('')
    const [primaryZone, ...extras] = selectedZoneIds
    const payload: Partial<Schedule> = {
      ...form,
      zone_id: primaryZone,
      extra_zone_ids: extras.length > 0 ? extras.join(',') : undefined,
    }
    try { await onSave(payload) }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      {err && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      <div>
        <label className="label">{t('schedule.zones')} *</label>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
          {zones.map(z => (
            <button key={z.id} type="button" onClick={() => toggleZone(z.id)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${selectedZoneIds.includes(z.id) ? 'bg-primary-900/30 text-primary-300' : 'text-gray-300'}`}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
              {z.name}
              {selectedZoneIds.includes(z.id) && (
                <span className="ml-auto text-xs bg-primary-800 text-primary-300 px-1.5 py-0.5 rounded">
                  #{selectedZoneIds.indexOf(z.id) + 1}
                </span>
              )}
            </button>
          ))}
        </div>
        {selectedZoneIds.length > 1 && (
          <p className="text-xs text-primary-400 mt-1">{t('schedule.multiZoneHint', { count: selectedZoneIds.length })}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('schedule.startTime')} *</label>
          <input className="input" type="time" required value={form.start_time ?? '07:00'}
            onChange={e => set('start_time', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('schedule.durationOverride')}</label>
          <input className="input" type="number" min={1} max={240} placeholder="—"
            value={form.duration_override_min ?? ''}
            onChange={e => set('duration_override_min', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
      </div>
      <div>
        <label className="label">{t('schedule.weekdays')}</label>
        <div className="flex gap-1.5 mt-1">
          {DAY_KEYS.map((d, i) => (
            <button key={d} type="button" onClick={() => toggleDay(i)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${days[i] ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
              {t(`schedule.days.${d}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t('schedule.mode')}</label>
        <select className="input" value={form.mode ?? 'sequential'}
          onChange={e => set('mode', e.target.value as WateringMode)}>
          <option value="sequential">{t('schedule.modes.sequential')}</option>
          <option value="parallel">{t('schedule.modes.parallel')}</option>
        </select>
      </div>
      <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-2">Skip conditions</p>
        {(['skip_if_rain', 'skip_if_soil_wet', 'skip_if_frost'] as const).map(key => (
          <div key={key} className="flex items-center gap-2">
            <input type="checkbox" id={key} checked={!!form[key]}
              onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-primary-500" />
            <label htmlFor={key} className="text-sm text-gray-300">{t(`schedule.${key}`)}</label>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="sch-en" checked={!!form.enabled}
          onChange={e => set('enabled', e.target.checked)} className="w-4 h-4 accent-primary-500" />
        <label htmlFor="sch-en" className="text-sm text-gray-300">{t('common.enabled')}</label>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">{t('common.cancel')}</button>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? '...' : t('common.save')}</button>
      </div>
    </form>
  )
}

export default function SchedulePage() {
  const { t } = useTranslation()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

  const load = () => Promise.all([
    schedulesApi.list().then(setSchedules),
    zonesApi.list().then(setZones),
  ]).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const save = async (data: Partial<Schedule>) => {
    if (selected) await schedulesApi.update(selected.id, data)
    else await schedulesApi.create(data)
    await load(); setModal(null)
  }

  const remove = async () => {
    if (!deleteTarget) return
    await schedulesApi.remove(deleteTarget.id); await load(); setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('schedule.title')}</h1>
        <button onClick={() => { setSelected(null); setModal('add') }} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={15} />{t('schedule.addSchedule')}
        </button>
      </div>

      {loading ? <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      : schedules.length === 0 ? (
        <div className="card text-center py-14 text-gray-600">
          <CalendarDays size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schedules.map(sch => (
            <div key={sch.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">{sch.start_time}</div>
                  {sch.all_zone_ids && sch.all_zone_ids.length > 1 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sch.all_zone_ids.map((zid, idx) => {
                        const z = zones.find(x => x.id === zid)
                        return z ? (
                          <span key={zid} className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                            <span className="text-gray-500">{idx + 1}.</span> {z.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mt-0.5">{sch.zone_name}</div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setSelected(sch); setModal('edit') }}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(sch)}
                    className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap mb-3">
                {DAY_KEYS.map((d, i) => (
                  <span key={d} className={`text-xs px-1.5 py-0.5 rounded font-medium ${sch.weekdays & (1 << i) ? 'bg-primary-800 text-primary-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600'}`}>
                    {t(`schedule.days.${d}`)}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {sch.duration_override_min && <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{sch.duration_override_min} min</span>}
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{t(`schedule.modes.${sch.mode}`).split(' ')[0]}</span>
                {!sch.enabled && <StatusBadge variant="gray">{t('common.disabled')}</StatusBadge>}
              </div>
              {sch.next_run && (
                <p className="text-xs text-gray-600 mt-2">
                  {t('schedule.nextRun')}: {new Date(sch.next_run).toLocaleString()}
                </p>
              )}
              <div className="flex gap-1 mt-2">
                {sch.skip_if_rain && <span className="text-xs text-blue-600" title="Skip if rain">🌧</span>}
                {sch.skip_if_soil_wet && <span className="text-xs text-green-700" title="Skip if soil wet">💧</span>}
                {sch.skip_if_frost && <span className="text-xs text-blue-400" title="Skip if frost">❄️</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'add'} title={t('schedule.addSchedule')} onClose={() => setModal(null)} width="lg">
        <ScheduleForm zones={zones} onSave={save} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'edit'} title={t('schedule.editSchedule')} onClose={() => setModal(null)} width="lg">
        {selected && <ScheduleForm initial={selected} zones={zones} onSave={save} onCancel={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!deleteTarget} title={t('schedule.deleteSchedule')}
        message={t('schedule.deleteConfirm')}
        onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}

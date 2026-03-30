import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Zap, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react'
import { valvesApi } from '../api/valves'
import { haEntitiesApi } from '../api/weather'
import { settingsApi } from '../api/settings'
import type { Valve, Zone, HAEntity } from '../types'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatusBadge from '../components/common/StatusBadge'
import EntityPicker from '../components/common/EntityPicker'
import { zonesApi } from '../api/zones'
import client from '../api/client'

function HaStateBadge({ state }: { state?: string }) {
  if (state === 'on') return <StatusBadge variant="green" pulse>ON</StatusBadge>
  if (state === 'off') return <StatusBadge variant="gray">OFF</StatusBadge>
  return <StatusBadge variant="yellow">{state ?? '?'}</StatusBadge>
}

function ValveCard({ valve, onEdit, onDelete, onToggle, toggling, t }: {
  valve: Valve; onEdit: () => void; onDelete: () => void; onToggle: () => void
  toggling: boolean; t: (k: string) => string
}) {
  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">{valve.name}</div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{valve.entity_id}</div>
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><Pencil size={12} /></button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <HaStateBadge state={valve.ha_state} />
        <button onClick={onToggle} disabled={toggling || !valve.enabled}
          className="text-gray-400 hover:text-primary-400 disabled:opacity-40 transition-colors p-1">
          {valve.ha_state === 'on'
            ? <ToggleRight size={24} className="text-primary-400" />
            : <ToggleLeft size={24} />}
        </button>
      </div>
      {!valve.enabled && <p className="text-xs text-gray-600 mt-1">{t('common.disabled')}</p>}
    </div>
  )
}

function ValveForm({ initial, zones, onSave, onCancel }: {
  initial?: Partial<Valve>; zones: Zone[]
  onSave: (data: Partial<Valve>) => Promise<void>; onCancel: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Valve>>({
    name: '', entity_id: '', zone_id: undefined, enabled: true, notes: '', ...initial,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof Valve, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleEntityChange = async (entityId: string) => {
    set('entity_id', entityId)
    if (entityId && !form.name) {
      try {
        const entities = await haEntitiesApi.valves()
        const found = entities.find((e: HAEntity) => e.entity_id === entityId)
        if (found) set('name', found.friendly_name)
      } catch { /* ignore */ }
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('')
    try { await onSave(form) }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      {err && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{err}</div>}
      <div>
        <label className="label">{t('valves.entityId')} *</label>
        <EntityPicker value={form.entity_id || ''} onChange={handleEntityChange} type="valves" />
      </div>
      <div>
        <label className="label">{t('common.name')} *</label>
        <input className="input" required value={form.name || ''} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className="label">{t('valves.zone')}</label>
        <select className="input" value={form.zone_id ?? ''}
          onChange={e => set('zone_id', e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">{t('valves.noZone')}</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input resize-none" rows={2}
          value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="v-en" checked={!!form.enabled}
          onChange={e => set('enabled', e.target.checked)} className="w-4 h-4 accent-primary-500" />
        <label htmlFor="v-en" className="text-sm text-gray-300">{t('common.enabled')}</label>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">{t('common.cancel')}</button>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? '...' : t('common.save')}</button>
      </div>
    </form>
  )
}

function MainValveSection({ t }: { t: (k: string) => string }) {
  const [entity, setEntity] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    settingsApi.getAll().then(cfg => {
      if (cfg['main_valve_entity_id']) setEntity(cfg['main_valve_entity_id'] ?? '')
    }).catch(() => {})
  }, [])

  const save = async () => {
    await settingsApi.set('main_valve_entity_id', entity || null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card border-primary-800/50">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={16} className="text-primary-400" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('valves.mainValve')}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('valves.mainValveDesc')}</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <EntityPicker value={entity} onChange={setEntity} type="valves" />
        </div>
        <button onClick={save} className="btn-primary btn-sm shrink-0">
          {saved ? '✓' : t('common.save')}
        </button>
      </div>
    </div>
  )
}

export default function ValvesPage() {
  const { t } = useTranslation()
  const [valves, setValves] = useState<Valve[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Valve | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Valve | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)

  const load = () => Promise.all([
    valvesApi.list().then(setValves),
    zonesApi.list().then(setZones),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])
  useEffect(() => {
    const id = setInterval(() => valvesApi.list().then(setValves).catch(() => {}), 5000)
    return () => clearInterval(id)
  }, [])

  const save = async (data: Partial<Valve>) => {
    if (selected) await valvesApi.update(selected.id, data)
    else await valvesApi.create(data)
    await load(); setModal(null)
  }

  const remove = async () => {
    if (!deleteTarget) return
    await valvesApi.remove(deleteTarget.id); await load(); setDeleteTarget(null)
  }

  const toggle = async (valve: Valve) => {
    setToggling(valve.id)
    try {
      const service = valve.ha_state === 'on' ? 'turn_off' : 'turn_on'
      await client.post('/api/ha/service', { entity_id: valve.entity_id, service })
      setTimeout(() => { valvesApi.list().then(setValves); setToggling(null) }, 1000)
    } catch { setToggling(null) }
  }

  const groupedByZone = zones.map(z => ({ zone: z, valves: valves.filter(v => v.zone_id === z.id) }))
  const unassigned = valves.filter(v => !v.zone_id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('valves.title')}</h1>
        <button onClick={() => { setSelected(null); setModal('add') }} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={15} />{t('valves.addValve')}
        </button>
      </div>

      <MainValveSection t={t} />
      {loading ? <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      : valves.length === 0 ? (
        <div className="card text-center py-14 text-gray-600">
          <Zap size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByZone.filter(g => g.valves.length > 0).map(({ zone, valves: zvs }) => (
            <div key={zone.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                <span className="text-sm font-semibold text-gray-300">{zone.name}</span>
                <span className="text-xs text-gray-600">({zvs.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {zvs.map(v => <ValveCard key={v.id} valve={v}
                  onEdit={() => { setSelected(v); setModal('edit') }}
                  onDelete={() => setDeleteTarget(v)}
                  onToggle={() => toggle(v)}
                  toggling={toggling === v.id} t={t} />)}
              </div>
            </div>
          ))}
          {unassigned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                <span className="text-sm font-semibold text-gray-400">{t('valves.noZone')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {unassigned.map(v => <ValveCard key={v.id} valve={v}
                  onEdit={() => { setSelected(v); setModal('edit') }}
                  onDelete={() => setDeleteTarget(v)}
                  onToggle={() => toggle(v)}
                  toggling={toggling === v.id} t={t} />)}
              </div>
            </div>
          )}
        </div>
      )}
      <Modal open={modal === 'add'} title={t('valves.addValve')} onClose={() => setModal(null)}>
        <ValveForm zones={zones} onSave={save} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'edit'} title={t('valves.editValve')} onClose={() => setModal(null)}>
        {selected && <ValveForm initial={selected} zones={zones} onSave={save} onCancel={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!deleteTarget} title={t('valves.deleteValve')}
        message={t('valves.deleteConfirm', { name: deleteTarget?.name })}
        onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}

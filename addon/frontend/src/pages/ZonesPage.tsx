import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Play, Square, Pencil, Trash2, Layers } from 'lucide-react'
import { zonesApi } from '../api/zones'
import { irrigationApi } from '../api/irrigation'
import type { Zone } from '../types'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatusBadge from '../components/common/StatusBadge'

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16']

function ZoneForm({ initial, onSave, onCancel }: {
  initial?: Partial<Zone>
  onSave: (data: Partial<Zone>) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Zone>>({
    name: '', color: '#22c55e', description: '', duration_min: 15, sequence_order: 0, enabled: true,
    ...initial,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof Zone, v: unknown) => setForm(f => ({ ...f, [k]: v }))

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
        <label className="label">{t('common.name')} *</label>
        <input className="input" required value={form.name || ''} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className="label">{t('zones.color')}</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }} />
          ))}
          <input type="color" value={form.color || '#22c55e'} onChange={e => set('color', e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0" title="Custom" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('zones.duration')} *</label>
          <input className="input" type="number" min={1} max={240} required
            value={form.duration_min || 15} onChange={e => set('duration_min', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">{t('zones.order')}</label>
          <input className="input" type="number" min={0}
            value={form.sequence_order || 0} onChange={e => set('sequence_order', Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="label">{t('common.description')}</label>
        <textarea className="input resize-none" rows={2}
          value={form.description || ''} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="z-en" checked={!!form.enabled}
          onChange={e => set('enabled', e.target.checked)} className="w-4 h-4 accent-primary-500" />
        <label htmlFor="z-en" className="text-sm text-gray-300">{t('common.enabled')}</label>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">{t('common.cancel')}</button>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? '...' : t('common.save')}</button>
      </div>
    </form>
  )
}

function StartDialog({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const { t } = useTranslation()
  const [duration, setDuration] = useState(zone.duration_min)
  const [loading, setLoading] = useState(false)
  const start = async () => {
    setLoading(true)
    try { await irrigationApi.start(zone.id, duration); onClose() }
    finally { setLoading(false) }
  }
  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="label">{t('zones.duration')}</label>
        <input className="input" type="number" min={1} max={240} value={duration}
          onChange={e => setDuration(Number(e.target.value))} />
      </div>
      <div className="flex gap-3 justify-end border-t border-gray-800 pt-3">
        <button onClick={onClose} className="btn-secondary btn-sm">{t('common.cancel')}</button>
        <button onClick={start} disabled={loading} className="btn-primary btn-sm flex items-center gap-2">
          <Play size={13} />{loading ? '...' : t('zones.startZone')}
        </button>
      </div>
    </div>
  )
}

export default function ZonesPage() {
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'start' | null>(null)
  const [selected, setSelected] = useState<Zone | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null)

  const load = () => zonesApi.list().then(setZones).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  useEffect(() => {
    const id = setInterval(() => irrigationApi.status().then(s => {
      setZones(prev => prev.map(z => ({ ...z, is_watering: s.active_zones.some(a => a.zone_id === z.id) })))
    }).catch(() => {}), 3000)
    return () => clearInterval(id)
  }, [])

  const save = async (data: Partial<Zone>) => {
    if (selected) await zonesApi.update(selected.id, data)
    else await zonesApi.create(data)
    await load(); setModal(null)
  }

  const remove = async () => {
    if (!deleteTarget) return
    await zonesApi.remove(deleteTarget.id); await load(); setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{t('zones.title')}</h1>
        <button onClick={() => { setSelected(null); setModal('add') }}
          className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={15} />{t('zones.addZone')}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      ) : zones.length === 0 ? (
        <div className="card text-center py-14 text-gray-600">
          <Layers size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {zones.map(zone => (
            <div key={zone.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                  <span className="font-semibold text-white truncate">{zone.name}</span>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => { setSelected(zone); setModal('edit') }}
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(zone)}
                    className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              {zone.description && <p className="text-xs text-gray-500 mb-3 truncate">{zone.description}</p>}
              <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
                <span className="bg-gray-800 px-2 py-0.5 rounded">{zone.duration_min} min</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded">#{zone.sequence_order}</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded">{zone.valve_count} {t('zones.valveCount').toLowerCase()}</span>
                {!zone.enabled && <StatusBadge variant="gray">{t('common.disabled')}</StatusBadge>}
              </div>
              <div className="flex items-center justify-between">
                {zone.is_watering
                  ? <StatusBadge variant="green" pulse>{t('zones.isWatering')}</StatusBadge>
                  : <StatusBadge variant="gray">{t('header.notWatering')}</StatusBadge>}
                {zone.is_watering ? (
                  <button onClick={() => irrigationApi.stop(zone.id).then(load)}
                    className="btn-danger btn-sm flex items-center gap-1.5">
                    <Square size={11} fill="currentColor" />{t('zones.stopZone')}
                  </button>
                ) : (
                  <button onClick={() => { setSelected(zone); setModal('start') }}
                    disabled={!zone.enabled || zone.valve_count === 0}
                    className="btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40">
                    <Play size={11} />{t('zones.startZone')}
                  </button>
                )}
              </div>
              {zone.valve_count === 0 && !zone.is_watering && (
                <p className="text-xs text-yellow-600 mt-2">{t('zones.noValves')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'add'} title={t('zones.addZone')} onClose={() => setModal(null)}>
        <ZoneForm onSave={save} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'edit'} title={t('zones.editZone')} onClose={() => setModal(null)}>
        {selected && <ZoneForm initial={selected} onSave={save} onCancel={() => setModal(null)} />}
      </Modal>
      <Modal open={modal === 'start'} title={t('zones.startZone')} onClose={() => setModal(null)} width="sm">
        {selected && <StartDialog zone={selected} onClose={() => { setModal(null); load() }} />}
      </Modal>
      <ConfirmDialog open={!!deleteTarget} title={t('zones.deleteZone')}
        message={t('zones.deleteConfirm', { name: deleteTarget?.name })}
        onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}

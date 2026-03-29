import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = true }: Props) {
  const { t } = useTranslation()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className={danger ? 'text-red-400 shrink-0 mt-0.5' : 'text-yellow-400 shrink-0 mt-0.5'} />
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary btn-sm">{t('common.cancel')}</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}>{t('common.confirm')}</button>
        </div>
      </div>
    </div>
  )
}

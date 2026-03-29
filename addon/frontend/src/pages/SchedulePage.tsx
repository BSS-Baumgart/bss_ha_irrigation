import { useTranslation } from 'react-i18next'

export default function SchedulePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">{t('nav.SchedulePage')}</h1>
      <div className="card text-gray-500 text-sm">Full implementation coming in Stage 2.</div>
    </div>
  )
}

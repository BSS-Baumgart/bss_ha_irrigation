import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Palette, Globe, RotateCcw } from 'lucide-react'
import { settingsApi } from '../api/settings'
import { useIrrigationStore, DEFAULT_COLORS, type ThemeColors } from '../store/irrigationStore'

type LangCode = 'en' | 'pl' | 'de'

const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'de', label: 'Deutsch' },
]

interface ColorField {
  key: keyof ThemeColors
  settingKey: string
  labelKey: string
}

const COLOR_FIELDS: ColorField[] = [
  { key: 'primary',       settingKey: 'theme_color_primary',            labelKey: 'settings.colorPrimary' },
  { key: 'primaryDark',   settingKey: 'theme_color_primary_dark',       labelKey: 'settings.colorPrimaryDark' },
  { key: 'bg',            settingKey: 'theme_color_bg',                 labelKey: 'settings.colorBg' },
  { key: 'surface',       settingKey: 'theme_color_surface',            labelKey: 'settings.colorSurface' },
  { key: 'border',        settingKey: 'theme_color_border',             labelKey: 'settings.colorBorder' },
  { key: 'textSecondary', settingKey: 'theme_color_text_secondary',     labelKey: 'settings.colorTextSecondary' },
]

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { themeColors, setThemeColors } = useIrrigationStore()
  const [lang, setLang] = useState<LangCode>('en')
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_COLORS })
  const [hexInputs, setHexInputs] = useState<Record<string, string>>({})
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    settingsApi.getAll().then(cfg => {
      if (cfg['app_language']) setLang(cfg['app_language'] as LangCode)
      const loaded: Partial<ThemeColors> = {}
      COLOR_FIELDS.forEach(f => {
        const val = cfg[f.settingKey]
        if (val) loaded[f.key] = val
      })
      const merged = { ...DEFAULT_COLORS, ...loaded }
      setColors(merged)
      const inputs: Record<string, string> = {}
      COLOR_FIELDS.forEach(f => { inputs[f.key] = merged[f.key] })
      setHexInputs(inputs)
    }).catch(() => {})
  }, [])

  // sync from store when changed externally
  useEffect(() => {
    setColors({ ...themeColors })
    const inputs: Record<string, string> = {}
    COLOR_FIELDS.forEach(f => { inputs[f.key] = themeColors[f.key] })
    setHexInputs(inputs)
  }, [themeColors])

  const saveLang = async (code: LangCode) => {
    setLang(code)
    i18n.changeLanguage(code)
    await settingsApi.set('app_language', code)
    showSaved()
  }

  const updateColor = (field: ColorField, value: string) => {
    setHexInputs(prev => ({ ...prev, [field.key]: value }))
    if (isValidHex(value)) {
      const next = { ...colors, [field.key]: value }
      setColors(next)
      setThemeColors({ [field.key]: value })
    }
  }

  const saveColors = async () => {
    await Promise.all(
      COLOR_FIELDS.map(f => settingsApi.set(f.settingKey, colors[f.key]))
    )
    showSaved()
  }

  const resetColors = async () => {
    setColors({ ...DEFAULT_COLORS })
    const inputs: Record<string, string> = {}
    COLOR_FIELDS.forEach(f => { inputs[f.key] = DEFAULT_COLORS[f.key] })
    setHexInputs(inputs)
    setThemeColors({ ...DEFAULT_COLORS })
    await Promise.all(
      COLOR_FIELDS.map(f => settingsApi.set(f.settingKey, DEFAULT_COLORS[f.key]))
    )
    showSaved()
  }

  const showSaved = () => {
    setSavedMsg(t('common.success'))
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Settings size={20} />
        {t('settings.title')}
      </h1>

      {savedMsg && (
        <div className="bg-primary-900/40 border border-primary-700 text-primary-300 text-sm rounded-lg px-4 py-2">
          ✓ {savedMsg}
        </div>
      )}

      {/* Language */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={15} className="text-primary-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.language')}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => saveLang(l.code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                lang === l.code
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color theme */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={15} className="text-primary-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.colorTheme')}</span>
          </div>
          <button
            onClick={resetColors}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RotateCcw size={12} />
            {t('settings.resetColors')}
          </button>
        </div>

        <p className="text-xs text-gray-500">{t('settings.colorThemeDesc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="label">{t(field.labelKey)}</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={isValidHex(hexInputs[field.key] ?? colors[field.key]) ? (hexInputs[field.key] ?? colors[field.key]) : '#000000'}
                  onChange={e => updateColor(field, e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-600 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={hexInputs[field.key] ?? colors[field.key]}
                  onChange={e => updateColor(field, e.target.value)}
                  placeholder="#rrggbb"
                  maxLength={7}
                  className={`input text-sm font-mono ${
                    isValidHex(hexInputs[field.key] ?? '') ? '' : 'border-red-600'
                  }`}
                />
                <div
                  className="w-9 h-9 rounded-lg shrink-0 border border-gray-600"
                  style={{ backgroundColor: isValidHex(colors[field.key]) ? colors[field.key] : '#888' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
          <button onClick={saveColors} className="btn-primary btn-sm">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

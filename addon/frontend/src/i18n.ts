import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import { INGRESS_BASE } from './lib/ingressBase'

// Language override set by user via UI switcher (takes priority over backend config)
const userLang = localStorage.getItem('irrigation-lang-override') || 'en'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: userLang,
    fallbackLng: 'en',
    supportedLngs: ['pl', 'en', 'de'],
    backend: {
      loadPath: `${INGRESS_BASE}/locales/{{lng}}/translation.json`,
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

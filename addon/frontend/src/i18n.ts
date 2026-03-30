import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import { INGRESS_BASE } from './lib/ingressBase'

const savedLang = localStorage.getItem('irrigation-lang') || 'en'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: savedLang,
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

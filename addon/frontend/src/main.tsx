import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import './index.css'

// Detect HA Ingress base path: /api/hassio_ingress/{token}
// When running locally (dev), this will be ''
function getIngressBase(): string {
  const parts = window.location.pathname.split('/')
  const idx = parts.indexOf('hassio_ingress')
  if (idx >= 0 && parts[idx + 1]) {
    return parts.slice(0, idx + 2).join('/')
  }
  return ''
}

export const INGRESS_BASE = getIngressBase()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={INGRESS_BASE}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import './index.css'
import { INGRESS_BASE } from './lib/ingressBase'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={INGRESS_BASE}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

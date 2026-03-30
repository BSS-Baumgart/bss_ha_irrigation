/**
 * Detect the HA Ingress base path from the current URL.
 * When running through HA Ingress: /api/hassio_ingress/{token}
 * When running locally (dev): ''
 */
function detectIngressBase(): string {
  const parts = window.location.pathname.split('/')
  const idx = parts.indexOf('hassio_ingress')
  if (idx >= 0 && parts[idx + 1]) {
    return parts.slice(0, idx + 2).join('/')
  }
  return ''
}

export const INGRESS_BASE = detectIngressBase()

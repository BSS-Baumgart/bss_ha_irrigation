import { useEffect, useRef } from 'react'
import { useIrrigationStore } from '../store/irrigationStore'
import { INGRESS_BASE } from '../lib/ingressBase'

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null)
  const { setActiveZones, setWsConnected } = useIrrigationStore()

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${proto}://${window.location.host}${INGRESS_BASE}/ws`

    const connect = () => {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setWsConnected(true)
        const ping = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send('ping')
          }
        }, 30000)
        const wsRef = ws.current!
        wsRef.onclose = () => {
          clearInterval(ping)
          setWsConnected(false)
          setTimeout(connect, 3000)
        }
      }

      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.event === 'connected' || data.event === 'zone_started' || data.event === 'zone_stopped') {
            if (data.active_zones !== undefined) {
              setActiveZones(data.active_zones)
            }
          }
        } catch {
          // ignore pong / non-JSON
        }
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    }

    connect()
    return () => {
      ws.current?.close()
    }
  }, [setActiveZones, setWsConnected])
}

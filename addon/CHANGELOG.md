# Changelog

## 1.2.0

- Fixed light mode — all pages now readable (white text on white background resolved)
- Weather settings (source, lat/lon, HA entity) persist across addon restarts in SQLite
- New `/api/settings` key-value store in addon database — all settings survive restarts
- Weather page: auto-saves lat/lon/source as you type (debounced 600 ms)
- Weather page: loads saved settings on mount before triggering first forecast fetch

## 1.1.0

- Mobile-responsive UI — sidebar slides in from the left on small screens
- Collapsible sidebar with hamburger menu in the header
- Dark / light mode toggle in the sidebar
- UI language now syncs from addon configuration on restart
- Language switcher in the sidebar saves user preference across restarts
- App icon displayed in the sidebar header
- Fixed HA Ingress asset paths (CSS/JS 404 on first install)
- Fixed translation files returning 404 through Ingress proxy
- Fixed WebSocket and API calls routing through Ingress base path
- Removed ha_url and ha_token from addon options — Supervisor provides these automatically

## 1.0.0

- Initial release
- Zone management with color labels and manual start
- Valve assignment from HA entity picker
- Sensor support: rain, soil moisture, temperature, flow meter, weather
- Weekly scheduler with sequential and parallel watering modes
- Weather-based skip via HA weather entity
- Virtual entities published to HA for dashboards and automations
- Real-time WebSocket status updates
- UI in Polish, English and German

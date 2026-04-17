# Changelog

## 1.4.0

- Fixed: history timestamps are now displayed in local time (were incorrectly shown as UTC).
- Fixed: entity picker in edit mode now shows the currently saved entity (valve / sensor).
- Improved: section cards now display the list of assigned valves with a hint when none are assigned.
- Improved: sensor skip logic now correctly uses per-schedule flags (skip_if_rain / skip_if_soil_wet / skip_if_frost).
- Improved: flow meter and weather entity sensors now participate in watering skip evaluation.
- Improved: sensor form now shows a description and threshold hint for each sensor type.
- New: multi-zone sequential schedules — select multiple sections in one schedule entry and they will run one after another automatically.

## 1.3.4

- Added CI validation workflow for frontend build on pull requests (develop and master).
- Updated project documentation for Home Assistant users and release workflow clarity.
- Added UI screenshots to repository documentation.

## 1.3.3

- Added dashboard quick actions: select section and start watering with custom duration.
- Added start modal on dashboard section cards to set watering time before manual start.
- Minor dashboard UX cleanup for active watering remaining time label.

## 1.3.2

- Improved sensors UI: current values are now user-friendly with translated states and units.
- Improved main valve section layout on Valves page for cleaner, more compact appearance.
- Removed language switcher from sidebar; UI language now follows addon configuration.

## 1.3.1

- Fixed: resolved backend 500 errors on irrigation status/start/stop endpoints during active watering.
- Fixed: improved robustness of valve and main valve service calls to avoid unhandled runtime failures.
- Fixed: header/dashboard watering state now has API polling fallback, so Stop All and active state remain visible even when WebSocket events are delayed.

## 1.3.0

- Fixed: header bar now correctly shows active watering status via WebSocket (active_zones included in zone_started/zone_stopped events)
- Added: main valve support — configure a master valve entity that opens before the first section starts and closes after the last section stops
- Dashboard: sections shown as cards with valve count, next schedule time, and inline progress bar when watering
- Renamed: "zones" → "sections" across the entire UI (PL: sekcje, EN: sections, DE: Sektionen)

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

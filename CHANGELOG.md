# Changelog

## [Unreleased] — Stage 1

### Added
- Project skeleton: Docker, HA addon config, build.json
- Backend: FastAPI, SQLModel models (Zone, Valve, Sensor, Schedule, WateringLog)
- Backend: All REST API routers (CRUD + irrigation control)
- Backend: HA WebSocket client (state subscription, service calls)
- Backend: APScheduler integration (zone watering scheduler)
- Backend: Weather service (HA entity + Open-Meteo)
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Frontend: i18next — Polish, English, German translations
- Frontend: Sidebar navigation, HeaderBar with live status
- Frontend: Zustand store + WebSocket hook for live updates
- Frontend: API client layer (zones, valves, sensors, schedules, irrigation, history, weather)
- repository.json for HA custom addon store

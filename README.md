# Irrigation BSS

Advanced irrigation management addon for Home Assistant. Control zones, valves, sensors and schedules from a built-in sidebar panel.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Addon-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Unlimited zones** — group solenoid valves into logical watering zones
- **HA entity picker** — select valve and sensor entities directly from your HA instance
- **Sensor support** — rain sensor, soil moisture, temperature (frost protection), flow meter
- **Smart scheduler** — weekly schedule with per-zone time and duration, sequential or parallel mode
- **Weather skip** — skip watering based on HA weather entity or Open-Meteo forecast
- **Virtual entities** — irrigation state published back to HA for use in dashboards and automations
- **Real-time UI** — live zone status, countdown timers, emergency stop
- **Dark / light mode** — toggleable from the sidebar
- **Multilingual** — Polish, English, German (community translations welcome)

## Installation

1. In Home Assistant go to **Settings → Add-ons → Add-on Store**
2. Click the three-dot menu (⋮) in the top right → **Custom repositories**
3. Add: `https://github.com/BSS-Baumgart/bss_ha_irrigation`
4. Find **Irrigation BSS** in the store and click **Install**
5. On the **Configuration** tab set your preferred `language` and `log_level`
6. Click **Start** — the panel appears automatically in the HA sidebar

No token or URL configuration needed — the addon connects to Home Assistant automatically via the Supervisor.

## First steps

1. **Valves** — add HA switch or input_boolean entities that control your solenoid valves
2. **Zones** — create zones and assign valves to them
3. **Sensors** *(optional)* — add a rain sensor, soil moisture probe or temperature sensor
4. **Schedule** — set days, start time and duration per zone
5. **Dashboard** — monitor live status, start zones manually, see next scheduled watering

## Virtual entities published to HA

| Entity | Type | Description |
|--------|------|-------------|
| `binary_sensor.irrigation_bss_watering` | binary_sensor | Any zone currently active |
| `sensor.irrigation_bss_active_zone` | sensor | Name of the active zone |
| `sensor.irrigation_bss_remaining_sec` | sensor | Remaining watering time in seconds |
| `sensor.irrigation_bss_next_watering` | sensor | Next scheduled watering (ISO timestamp) |
| `binary_sensor.irrigation_bss_rain_blocked` | binary_sensor | Watering blocked by rain sensor |
| `binary_sensor.irrigation_bss_frost_blocked` | binary_sensor | Frost protection active |
| `binary_sensor.irrigation_bss_zone_{id}` | binary_sensor | Per-zone watering state |

## Local development

```bash
# Backend
cd addon
pip install -r backend/requirements.txt
cp .env.example .env   # fill in HA_URL and HA_TOKEN
python -m uvicorn backend.main:app --reload --port 8099

# Frontend (separate terminal)
cd addon/frontend
npm install
npm run dev
```

## Contributing translations

Copy `addon/frontend/public/locales/en/translation.json` to a new language folder and submit a pull request.

## License

MIT

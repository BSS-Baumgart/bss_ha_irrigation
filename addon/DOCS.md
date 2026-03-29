# Irrigation BSS — Documentation

## Setup

1. Install addon from repository
2. Go to addon **Configuration** tab
3. Set `ha_token` — create one in HA: Profile → Security → Long-lived access tokens
4. Optionally set `language` (`pl`, `en`, `de`)
5. Start the addon — it appears automatically in the HA sidebar

## First steps

1. **Add valves** — Valves page → pick HA switch/input_boolean entities
2. **Create zones** — Zones page → group valves into watering zones
3. **Add sensors** (optional) — Sensors page → rain sensor, soil moisture, temperature
4. **Set schedules** — Schedule page → pick days, time and duration per zone
5. **Check dashboard** — live status, manual controls, next watering info

## Sensor types

| Type | HA entity | Effect |
|---|---|---|
| Rain | `binary_sensor` | Skip watering when `on` |
| Soil moisture | `sensor` | Skip zone when above threshold (%) |
| Flow meter | `sensor` | Monitor water usage |
| Temperature | `sensor` | Freeze protection below 2°C |
| Weather | `weather` | Forecast-based skip |

## Watering modes

- **Sequential** — one zone at a time (safe for low water pressure)
- **Parallel** — all zones simultaneously

## Languages

UI is available in **Polish**, **English** and **German**.
Community translations can be added by contributing `frontend/public/locales/{lang}/translation.json`.

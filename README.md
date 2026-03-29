# Irrigation BSS — Home Assistant Addon

Advanced irrigation management system for Home Assistant.
Manage zones, valves, sensors, schedules and weather-based automation — all from a beautiful sidebar UI.

## Features

- Unlimited zones and solenoid valves
- Valve entities picked directly from HA entity list
- Rain sensor, soil moisture, temperature, flow meter support
- Weekly scheduler with sequential/parallel watering modes
- Weather-based skip (HA weather entity or Open-Meteo)
- Real-time WebSocket status updates
- Full UI in **Polish**, **English** and **German** (community translations welcome)

## Installation

1. In Home Assistant: **Settings → Add-ons → Add-on Store → ⋮ → Add custom repository**
2. Enter: `https://github.com/BSS-Baumgart/bss_ha_irrigation`
3. Find **Irrigation BSS** → Install
4. Configure `ha_token` (HA Profile → Security → Long-lived access tokens)
5. Start → the panel appears in your HA sidebar automatically

## Development

```bash
# Backend
cd addon
pip install -r backend/requirements.txt
DATA_DIR=./data STATIC_DIR=./frontend/dist python -m uvicorn backend.main:app --reload --port 8099

# Frontend (separate terminal)
cd addon/frontend
npm install
npm run dev      # dev server with proxy to :8099
```

## Contributing translations

Add `addon/frontend/public/locales/{lang}/translation.json` — copy `en/translation.json` as template.

## License

MIT

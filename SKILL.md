# Irrigation BSS — Home Assistant Addon

> Plan projektu, etapy implementacji i decyzje architektoniczne.

## Status etapów

| # | Etap | Status |
|---|------|--------|
| 1 | Szkielet projektu (Dockerfile, config.yaml, struktura) | ⏳ W toku |
| 2 | Backend core — modele DB, FastAPI, HA WebSocket client | ⬜ Oczekuje |
| 3 | Scheduler — APScheduler, logika nawodnienia, rain-skip | ⬜ Oczekuje |
| 4 | Frontend layout — Sidebar, HeaderBar, routing, i18n | ⬜ Oczekuje |
| 5 | Widok: Strefy (Zones) — CRUD, manual start/stop | ⬜ Oczekuje |
| 6 | Widok: Zawory (Valves) — picker encji HA, przypisanie | ⬜ Oczekuje |
| 7 | Widok: Czujniki (Sensors) — rain, soil, flow, frost | ⬜ Oczekuje |
| 8 | Widok: Harmonogram (Schedule) — tygodniowy, warunki | ⬜ Oczekuje |
| 9 | Widok: Pogoda (Weather) — HA weather entity + Open-Meteo | ⬜ Oczekuje |
| 10 | Widok: Historia (History) — log sesji, zużycie wody | ⬜ Oczekuje |
| 11 | Widok: Dashboard — status live, quick controls | ⬜ Oczekuje |
| 12 | Packaging — repository.json, HACS support, CI/CD | ⬜ Oczekuje |

---

## Architektura

```
HA Supervisor
└── Addon: irrigation_bss (Docker container)
    ├── Python Backend (FastAPI + APScheduler)
    │   ├── HA WebSocket Client  ← entities, states, service calls
    │   ├── SQLite via SQLModel  ← zones, valves, schedules, history
    │   └── REST API /api/*      ← konsumuje frontend
    │
    └── React Frontend (Vite + Tailwind)
        ├── Header Bar           ← status podlewania, czujniki, "Stop All"
        ├── Sidebar              ← nawigacja
        └── Pages: Dashboard, Zones, Valves, Sensors, Schedule, Weather, History
```

### Ingress
Addon serwuje frontend statycznie przez FastAPI na porcie 8099.
HA Supervisor proxy'uje przez Ingress → pojawia się w sidebarze HA.

---

## Stack technologiczny

| Warstwa | Tech |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn, APScheduler 3.x |
| HA komunikacja | aiohttp WebSocket, HA Long-lived Access Token |
| Baza danych | SQLite, SQLModel (Pydantic + SQLAlchemy) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3 |
| i18n | react-i18next — pliki: `public/locales/{pl,en,de}/translation.json` |
| Kontener | Docker, python:3.12-alpine |

---

## Modele danych

### Zone
```
id, name, color, description, sequence_order, duration_min
```

### Valve
```
id, name, entity_id (HA switch/input_boolean), zone_id (FK), enabled
```
> Jeden zawór → tylko jedna strefa. Walidacja przy przypisaniu.

### Sensor
```
id, name, entity_id, type (rain|soil|flow|temp|weather), threshold, enabled
```

### Schedule
```
id, zone_id (FK), weekdays (bitmask), start_time, duration_override_min,
mode (sequential|parallel), enabled
```

### WateringLog
```
id, zone_id, valve_id, started_at, ended_at, duration_sec,
triggered_by (schedule|manual), skipped_reason (rain|soil|frost|null)
```

---

## Reguły biznesowe

1. **Jeden zawór = jedna strefa** — przy próbie przypisania do drugiej: error 409
2. **Rain skip** — jeśli czujnik deszczu `on`, pomijamy zaplanowane podlewanie (log wpis ze skip)
3. **Frost protection** — jeśli temp < 2°C, blokada całkowita
4. **Soil skip** — jeśli wilgotność gleby > próg dla strefy, pomijamy tę strefę
5. **Sequential mode** — w danej chwili aktywna jest tylko jedna strefa naraz; scheduler kolejkuje
6. **Emergency stop** — `POST /api/irrigation/stop-all` wyłącza wszystkie zawory natychmiast
7. **Manual override** — manualne uruchomienie anuluje bieżący harmonogram dla tej strefy

---

## API (backend REST)

```
GET/POST/PUT/DELETE  /api/zones
GET/POST/PUT/DELETE  /api/valves
GET/POST/PUT/DELETE  /api/sensors
GET/POST/PUT/DELETE  /api/schedules

GET    /api/irrigation/status          ← aktywne strefy, kolejka
POST   /api/irrigation/start/{zone_id} ← manual start z duration
POST   /api/irrigation/stop/{zone_id}
POST   /api/irrigation/stop-all

GET    /api/ha/entities                ← lista encji z HA (switch/sensor/weather)
GET    /api/history                    ← log podlewania

GET    /api/weather                    ← prognoza (HA entity lub Open-Meteo)
```

WebSocket: `ws://addon/ws` — push updates do frontendu (valve states, active zone)

---

## i18n — pliki tłumaczeń

```
frontend/public/locales/
├── pl/translation.json  ← Polski (domyślny)
├── en/translation.json  ← English
└── de/translation.json  ← Deutsch
```

Klucze w formacie płaskim + namespace'y: `common`, `zones`, `valves`, `sensors`, `schedule`, `weather`, `history`.
Społeczność może dodawać kolejne foldery językowe (fr, nl, cs, hu...).

---

## Instalacja w Home Assistant

### Dla użytkowników
1. HA → Settings → Add-ons → Add-on Store → ⋮ (menu) → **Add custom repository**
2. URL: `https://github.com/BSS-Baumgart/bss_ha_irrigation`
3. Szukaj "Irrigation BSS" → Install
4. Konfiguracja: wklej Long-lived Access Token z HA (profil użytkownika → Security)
5. Start → Sidebar pojawia się automatycznie

### Dla developerów (lokalne testy)
```bash
cd irrigation_bss
pip install -r backend/requirements.txt
cd frontend && npm install && npm run build && cd ..
python backend/main.py
# otwórz http://localhost:8099
```

---

## Struktura plików projektu

```
irrigation_bss/              ← root repo
├── SKILL.md                 ← ten plik
├── README.md
├── CHANGELOG.md
├── repository.json          ← HA custom repository manifest
│
└── addon/                   ← folder addonsa HA
    ├── config.yaml          ← addon manifest
    ├── build.json           ← multi-arch (amd64, aarch64, armv7)
    ├── Dockerfile
    ├── run.sh
    ├── DOCS.md
    │
    ├── backend/
    │   ├── main.py
    │   ├── config.py
    │   ├── requirements.txt
    │   ├── models/
    │   │   ├── __init__.py
    │   │   ├── zone.py
    │   │   ├── valve.py
    │   │   ├── sensor.py
    │   │   ├── schedule.py
    │   │   └── history.py
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── ha_client.py
    │   │   ├── scheduler.py
    │   │   ├── irrigation.py
    │   │   └── weather.py
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   ├── zones.py
    │   │   ├── valves.py
    │   │   ├── sensors.py
    │   │   ├── schedules.py
    │   │   ├── irrigation.py
    │   │   ├── history.py
    │   │   ├── weather.py
    │   │   └── ha_entities.py
    │   └── database/
    │       ├── __init__.py
    │       └── db.py
    │
    └── frontend/
        ├── package.json
        ├── vite.config.ts
        ├── tailwind.config.ts
        ├── tsconfig.json
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── i18n.ts
            ├── types/
            │   └── index.ts
            ├── api/
            │   ├── client.ts
            │   ├── zones.ts
            │   ├── valves.ts
            │   ├── sensors.ts
            │   ├── schedules.ts
            │   ├── irrigation.ts
            │   ├── history.ts
            │   └── weather.ts
            ├── hooks/
            │   ├── useIrrigationStatus.ts
            │   └── useWebSocket.ts
            ├── store/
            │   └── irrigationStore.ts  (Zustand)
            ├── components/
            │   ├── Layout/
            │   │   ├── AppLayout.tsx
            │   │   ├── Sidebar.tsx
            │   │   └── HeaderBar.tsx
            │   ├── common/
            │   │   ├── EntityPicker.tsx  ← picker encji z HA
            │   │   ├── StatusBadge.tsx
            │   │   └── ConfirmDialog.tsx
            │   ├── Zones/
            │   ├── Valves/
            │   ├── Sensors/
            │   ├── Schedule/
            │   ├── Weather/
            │   └── History/
            └── pages/
                ├── DashboardPage.tsx
                ├── ZonesPage.tsx
                ├── ValvesPage.tsx
                ├── SensorsPage.tsx
                ├── SchedulePage.tsx
                ├── WeatherPage.tsx
                └── HistoryPage.tsx
```

---

## Decyzje architektoniczne

- **FastAPI zamiast Flask** — async-native, auto OpenAPI docs, WebSocket support built-in
- **SQLModel** — jeden model dla Pydantic (API) i SQLAlchemy (DB), zero duplikacji
- **Zustand zamiast Redux** — minimalny boilerplate dla stanu frontendu
- **react-i18next** — standard w ekosystemie React, łatwe dodawanie języków przez społeczność
- **APScheduler** — wbudowany scheduler w Pythonie, brak zależności od cron OS
- **Alpine base image** — mały rozmiar (~50MB vs ~200MB slim)

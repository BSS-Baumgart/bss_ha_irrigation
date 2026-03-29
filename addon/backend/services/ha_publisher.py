"""
HA Entity Publisher — pushes irrigation state to Home Assistant as virtual entities.

Uses POST /api/states/{entity_id} to create/update entities in HA.
These appear in HA entity registry and can be used in dashboards, automations, etc.

Published entities:
  binary_sensor.irrigation_bss_watering         — any zone active
  sensor.irrigation_bss_active_zone             — active zone name or "idle"
  sensor.irrigation_bss_remaining_sec           — remaining seconds (0 if idle)
  sensor.irrigation_bss_next_watering           — ISO datetime of next schedule
  binary_sensor.irrigation_bss_rain_blocked     — watering blocked by rain sensor
  binary_sensor.irrigation_bss_zone_{id}        — per-zone watering state
  sensor.irrigation_bss_zone_{id}_status        — per-zone status string
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import aiohttp

from backend.config import settings
from backend.services import irrigation
from backend.services import scheduler as sched

logger = logging.getLogger(__name__)

_running = False
PUBLISH_INTERVAL = 10   # seconds


async def _push_state(session: aiohttp.ClientSession, entity_id: str,
                      state: str, attributes: dict):
    """Push a single entity state to HA REST API."""
    url = f"{settings.ha_url}/api/states/{entity_id}"
    headers = {
        "Authorization": f"Bearer {settings.ha_token}",
        "Content-Type": "application/json",
    }
    payload = {"state": state, "attributes": attributes}
    try:
        async with session.post(url, json=payload, headers=headers,
                                timeout=aiohttp.ClientTimeout(total=5)) as resp:
            if resp.status not in (200, 201):
                logger.warning(f"HA push failed for {entity_id}: HTTP {resp.status}")
    except Exception as e:
        logger.debug(f"HA push error for {entity_id}: {e}")


async def publish_once():
    """Publish current irrigation state to HA as virtual entities."""
    if not settings.ha_token:
        return

    active_zones = irrigation.get_active_zones()
    any_watering = len(active_zones) > 0

    # Check rain sensor blocking
    from backend.services.irrigation import check_sensors_blocking
    from backend.models import SkipReason
    skip = await check_sensors_blocking()
    rain_blocked = skip in (SkipReason.rain,)
    frost_blocked = skip in (SkipReason.frost,)

    # Next watering time
    from sqlmodel import Session, select
    from backend.database.db import engine
    from backend.models import Schedule
    next_run: Optional[str] = None
    with Session(engine) as session:
        schedules = session.exec(select(Schedule).where(Schedule.enabled == True)).all()
    runs = [sched.get_next_run(s.id) for s in schedules if sched.get_next_run(s.id)]
    if runs:
        next_run = min(runs)

    active_zone = active_zones[0] if active_zones else None

    headers_base = {
        "friendly_name": "Irrigation BSS — Watering",
        "icon": "mdi:sprinkler",
        "integration": "irrigation_bss",
    }

    entities = [
        # Master watering state
        ("binary_sensor.irrigation_bss_watering", "on" if any_watering else "off", {
            "friendly_name": "Irrigation BSS — Watering Active",
            "device_class": "running",
            "icon": "mdi:sprinkler-variant",
            "integration": "irrigation_bss",
        }),
        # Active zone name
        ("sensor.irrigation_bss_active_zone", active_zone["zone_name"] if active_zone else "idle", {
            "friendly_name": "Irrigation BSS — Active Zone",
            "icon": "mdi:layers",
            "integration": "irrigation_bss",
        }),
        # Remaining seconds
        ("sensor.irrigation_bss_remaining_sec",
         str(active_zone["remaining_sec"]) if active_zone else "0", {
             "friendly_name": "Irrigation BSS — Remaining Time",
             "unit_of_measurement": "s",
             "icon": "mdi:timer-outline",
             "integration": "irrigation_bss",
         }),
        # Next scheduled watering
        ("sensor.irrigation_bss_next_watering", next_run or "unknown", {
            "friendly_name": "Irrigation BSS — Next Watering",
            "device_class": "timestamp",
            "icon": "mdi:calendar-clock",
            "integration": "irrigation_bss",
        }),
        # Rain blocked
        ("binary_sensor.irrigation_bss_rain_blocked", "on" if rain_blocked else "off", {
            "friendly_name": "Irrigation BSS — Rain Blocked",
            "device_class": "moisture",
            "icon": "mdi:weather-rainy",
            "integration": "irrigation_bss",
        }),
        # Frost blocked
        ("binary_sensor.irrigation_bss_frost_blocked", "on" if frost_blocked else "off", {
            "friendly_name": "Irrigation BSS — Frost Protection Active",
            "device_class": "cold",
            "icon": "mdi:snowflake",
            "integration": "irrigation_bss",
        }),
    ]

    # Per-zone entities
    for zone_info in active_zones:
        zid = zone_info["zone_id"]
        zname = zone_info["zone_name"]
        entities.append((
            f"binary_sensor.irrigation_bss_zone_{zid}",
            "on",
            {
                "friendly_name": f"Irrigation BSS — {zname}",
                "device_class": "running",
                "icon": "mdi:sprinkler",
                "zone_id": zid,
                "remaining_sec": zone_info["remaining_sec"],
                "duration_min": zone_info["duration_min"],
                "integration": "irrigation_bss",
            }
        ))

    # Mark all known zones as off (we'll overwrite active ones above)
    from backend.models import Zone
    with Session(engine) as session:
        all_zones = session.exec(select(Zone)).all()

    active_ids = {z["zone_id"] for z in active_zones}
    for zone in all_zones:
        if zone.id not in active_ids:
            entities.append((
                f"binary_sensor.irrigation_bss_zone_{zone.id}",
                "off",
                {
                    "friendly_name": f"Irrigation BSS — {zone.name}",
                    "device_class": "running",
                    "icon": "mdi:sprinkler",
                    "zone_id": zone.id,
                    "remaining_sec": 0,
                    "integration": "irrigation_bss",
                }
            ))

    async with aiohttp.ClientSession() as http:
        await asyncio.gather(*[
            _push_state(http, eid, state, attrs)
            for eid, state, attrs in entities
        ])

    logger.debug(f"Published {len(entities)} entities to HA")


async def run_publisher():
    """Background loop — publishes state every PUBLISH_INTERVAL seconds."""
    global _running
    _running = True
    logger.info(f"HA publisher started (interval: {PUBLISH_INTERVAL}s)")
    while _running:
        try:
            await publish_once()
        except Exception as e:
            logger.warning(f"HA publisher error: {e}")
        await asyncio.sleep(PUBLISH_INTERVAL)


def start():
    asyncio.create_task(run_publisher())


def stop():
    global _running
    _running = False

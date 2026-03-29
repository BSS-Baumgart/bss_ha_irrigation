"""
Endpoint to browse HA entities — used by frontend entity pickers.
"""
from typing import List, Optional
from fastapi import APIRouter, Query

from backend.services import ha_client

router = APIRouter(prefix="/api/ha", tags=["ha"])

VALVE_DOMAINS = {"switch", "input_boolean", "light"}
SENSOR_DOMAINS = {"binary_sensor", "sensor"}
WEATHER_DOMAINS = {"weather"}


@router.get("/entities")
async def get_entities(
    domain: Optional[str] = Query(None, description="Filter by domain (switch, sensor, etc.)"),
    search: Optional[str] = Query(None),
):
    states = await ha_client.get_states()
    result = []
    for s in states:
        entity_id = s.get("entity_id", "")
        if domain and not entity_id.startswith(f"{domain}."):
            continue
        if search and search.lower() not in entity_id.lower() and \
                search.lower() not in (s.get("attributes", {}).get("friendly_name", "")).lower():
            continue
        result.append({
            "entity_id": entity_id,
            "friendly_name": s.get("attributes", {}).get("friendly_name", entity_id),
            "state": s.get("state"),
            "domain": entity_id.split(".")[0],
        })
    return sorted(result, key=lambda x: x["entity_id"])


@router.get("/entities/valves")
async def get_valve_entities():
    states = await ha_client.get_states()
    return [
        {
            "entity_id": s["entity_id"],
            "friendly_name": s.get("attributes", {}).get("friendly_name", s["entity_id"]),
            "state": s.get("state"),
        }
        for s in states
        if s["entity_id"].split(".")[0] in VALVE_DOMAINS
    ]


@router.get("/entities/sensors")
async def get_sensor_entities():
    states = await ha_client.get_states()
    return [
        {
            "entity_id": s["entity_id"],
            "friendly_name": s.get("attributes", {}).get("friendly_name", s["entity_id"]),
            "state": s.get("state"),
            "unit": s.get("attributes", {}).get("unit_of_measurement"),
            "device_class": s.get("attributes", {}).get("device_class"),
        }
        for s in states
        if s["entity_id"].split(".")[0] in SENSOR_DOMAINS
    ]


@router.get("/entities/weather")
async def get_weather_entities():
    states = await ha_client.get_states()
    return [
        {
            "entity_id": s["entity_id"],
            "friendly_name": s.get("attributes", {}).get("friendly_name", s["entity_id"]),
            "state": s.get("state"),
        }
        for s in states
        if s["entity_id"].split(".")[0] in WEATHER_DOMAINS
    ]

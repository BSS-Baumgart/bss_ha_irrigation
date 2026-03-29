"""
Weather service — reads from HA weather entity or Open-Meteo API (free, no key needed).
"""
import logging
from typing import Optional
import aiohttp

from backend.services import ha_client

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def get_forecast(weather_entity_id: Optional[str] = None,
                       lat: Optional[float] = None,
                       lon: Optional[float] = None) -> dict:
    """
    Returns: {
        condition: str,
        temperature: float,
        precipitation_probability: int,
        rain_expected_24h: bool,
        forecast: [...]
    }
    """
    if weather_entity_id:
        return await _from_ha_entity(weather_entity_id)
    if lat and lon:
        return await _from_open_meteo(lat, lon)
    return {"condition": "unknown", "temperature": None, "precipitation_probability": 0,
            "rain_expected_24h": False, "forecast": []}


async def _from_ha_entity(entity_id: str) -> dict:
    state = ha_client.get_cached_state(entity_id)
    if not state:
        return {"condition": "unknown", "temperature": None, "precipitation_probability": 0,
                "rain_expected_24h": False, "forecast": []}

    attrs = state.get("attributes", {})
    condition = state.get("state", "unknown")
    temp = attrs.get("temperature")
    precip = attrs.get("precipitation_probability", 0)
    rain_conditions = {"rainy", "pouring", "lightning-rainy", "lightning"}
    rain_expected = condition in rain_conditions or (precip is not None and precip > 50)

    forecast = []
    for f in attrs.get("forecast", [])[:24]:
        forecast.append({
            "datetime": f.get("datetime"),
            "condition": f.get("condition"),
            "temperature": f.get("temperature"),
            "precipitation_probability": f.get("precipitation_probability", 0),
        })

    return {
        "condition": condition,
        "temperature": temp,
        "precipitation_probability": precip,
        "rain_expected_24h": rain_expected,
        "forecast": forecast,
    }


async def _from_open_meteo(lat: float, lon: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,precipitation_probability,weathercode",
        "hourly": "precipitation_probability",
        "forecast_days": 1,
    }
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(OPEN_METEO_URL, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json()

        current = data.get("current", {})
        temp = current.get("temperature_2m")
        precip = current.get("precipitation_probability", 0)
        hourly_precip = data.get("hourly", {}).get("precipitation_probability", [])
        max_precip = max(hourly_precip) if hourly_precip else 0
        rain_expected = max_precip > 50

        return {
            "condition": _wmo_to_condition(current.get("weathercode", 0)),
            "temperature": temp,
            "precipitation_probability": precip,
            "rain_expected_24h": rain_expected,
            "forecast": [],
        }
    except Exception as e:
        logger.error(f"Open-Meteo fetch failed: {e}")
        return {"condition": "unknown", "temperature": None, "precipitation_probability": 0,
                "rain_expected_24h": False, "forecast": []}


def _wmo_to_condition(code: int) -> str:
    if code == 0:
        return "sunny"
    if code in range(1, 4):
        return "partlycloudy"
    if code in range(51, 68) or code in range(80, 83):
        return "rainy"
    if code in range(71, 78) or code in range(85, 87):
        return "snowy"
    if code in range(95, 100):
        return "lightning-rainy"
    return "cloudy"

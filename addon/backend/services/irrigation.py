import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlmodel import Session, select

from backend.config import settings
from backend.database.db import engine
from backend.models import Zone, Valve, Sensor, WateringLog, SensorType, SkipReason, TriggerSource, AppSetting
from backend.services import ha_client

logger = logging.getLogger(__name__)

_active: Dict[int, dict] = {}
_ws_broadcast: Optional[callable] = None


def set_ws_broadcast(fn):
    global _ws_broadcast
    _ws_broadcast = fn


async def _broadcast(event: str, data: dict):
    if _ws_broadcast:
        await _ws_broadcast({"event": event, **data})


def _get_main_valve_entity() -> Optional[str]:
    with Session(engine) as session:
        row = session.get(AppSetting, "main_valve_entity_id")
        return row.value if row and row.value else None


def is_watering(zone_id: int) -> bool:
    return zone_id in _active


def get_active_zones() -> List[dict]:
    result = []
    for zone_id, info in _active.items():
        elapsed = (datetime.now(timezone.utc) - info["started_at"]).seconds
        result.append({
            "zone_id": zone_id,
            "zone_name": info.get("zone_name"),
            "started_at": info["started_at"].isoformat(),
            "duration_min": info["duration_min"],
            "elapsed_sec": elapsed,
            "remaining_sec": max(0, info["duration_min"] * 60 - elapsed),
        })
    return result


async def check_sensors_blocking(zone_id: Optional[int] = None) -> Optional[SkipReason]:
    with Session(engine) as session:
        sensors = session.exec(select(Sensor).where(Sensor.enabled == True)).all()

    for sensor in sensors:
        state = ha_client.get_cached_state(sensor.entity_id)
        if not state:
            continue

        val = state.get("state", "")

        if sensor.sensor_type == SensorType.rain:
            if val == "on":
                return SkipReason.rain

        elif sensor.sensor_type == SensorType.temperature:
            try:
                if float(val) < (sensor.threshold if sensor.threshold is not None else 2.0):
                    return SkipReason.frost
            except (ValueError, TypeError):
                pass

        elif sensor.sensor_type == SensorType.soil:
            try:
                threshold = sensor.threshold if sensor.threshold is not None else 80.0
                if float(val) > threshold:
                    return SkipReason.soil_wet
            except (ValueError, TypeError):
                pass

    return None


async def start_zone(zone_id: int, duration_min: Optional[int] = None,
                     triggered_by: TriggerSource = TriggerSource.manual,
                     skip_sensor_check: bool = False) -> dict:
    with Session(engine) as session:
        zone = session.get(Zone, zone_id)
        if not zone:
            return {"ok": False, "error": "Zone not found"}
        if not zone.enabled:
            return {"ok": False, "error": "Zone is disabled"}

        valves = session.exec(
            select(Valve).where(Valve.zone_id == zone_id, Valve.enabled == True)
        ).all()

        if not valves:
            return {"ok": False, "error": "Zone has no enabled valves"}

        duration = duration_min or zone.duration_min
        valve_ids = [v.id for v in valves]
        valve_entities = [v.entity_id for v in valves]
        zone_name = zone.name

    if not skip_sensor_check:
        skip = await check_sensors_blocking(zone_id)
        if skip:
            _log_skip(zone_id, zone_name, valve_ids, skip, triggered_by)
            return {"ok": False, "skipped": True, "skip_reason": skip.value}

    if zone_id in _active:
        return {"ok": False, "error": "Zone already watering"}

    if len(_active) == 0:
        main_valve = _get_main_valve_entity()
        if main_valve:
            await ha_client.turn_on(main_valve)
            logger.info(f"Main valve {main_valve} opened")

    for entity_id in valve_entities:
        await ha_client.turn_on(entity_id)

    log_entry = WateringLog(
        zone_id=zone_id,
        zone_name=zone_name,
        valve_ids=",".join(str(v) for v in valve_ids),
        started_at=datetime.now(timezone.utc),
        triggered_by=triggered_by,
    )
    with Session(engine) as session:
        session.add(log_entry)
        session.commit()
        session.refresh(log_entry)
        log_id = log_entry.id

    task = asyncio.create_task(
        _auto_stop(zone_id, duration, valve_entities, log_id)
    )

    _active[zone_id] = {
        "task": task,
        "started_at": log_entry.started_at,
        "duration_min": duration,
        "zone_name": zone_name,
        "log_id": log_id,
    }

    await _broadcast("zone_started", {
        "zone_id": zone_id, "zone_name": zone_name, "duration_min": duration,
        "active_zones": get_active_zones(),
    })
    logger.info(f"Zone {zone_name} started ({duration} min)")
    return {"ok": True, "zone_id": zone_id, "duration_min": duration}


async def stop_zone(zone_id: int) -> dict:
    if zone_id not in _active:
        return {"ok": False, "error": "Zone not watering"}

    info = _active[zone_id]
    info["task"].cancel()
    await _finish_zone(zone_id, info)
    return {"ok": True}


async def stop_all() -> dict:
    zone_ids = list(_active.keys())
    for zone_id in zone_ids:
        await stop_zone(zone_id)
    logger.warning("STOP ALL executed")
    return {"ok": True, "stopped_zones": zone_ids}


async def _auto_stop(zone_id: int, duration_min: int, valve_entities: List[str], log_id: int):
    try:
        await asyncio.sleep(duration_min * 60)
        for entity_id in valve_entities:
            await ha_client.turn_off(entity_id)
        info = _active.pop(zone_id, {})
        if len(_active) == 0:
            main_valve = _get_main_valve_entity()
            if main_valve:
                await ha_client.turn_off(main_valve)
                logger.info(f"Main valve {main_valve} closed")
        _update_log(log_id, info.get("started_at"))
        await _broadcast("zone_stopped", {"zone_id": zone_id, "reason": "completed", "active_zones": get_active_zones()})
        logger.info(f"Zone {zone_id} completed after {duration_min} min")
    except asyncio.CancelledError:
        for entity_id in valve_entities:
            await ha_client.turn_off(entity_id)
        info = _active.pop(zone_id, {})
        if len(_active) == 0:
            main_valve = _get_main_valve_entity()
            if main_valve:
                await ha_client.turn_off(main_valve)
                logger.info(f"Main valve {main_valve} closed")
        _update_log(log_id, info.get("started_at"), skipped=True, skip_reason=SkipReason.manual_stop)
        await _broadcast("zone_stopped", {"zone_id": zone_id, "reason": "cancelled", "active_zones": get_active_zones()})


async def _finish_zone(zone_id: int, info: dict):
    with Session(engine) as session:
        zone = session.get(Zone, zone_id)
        if zone:
            valves = session.exec(
                select(Valve).where(Valve.zone_id == zone_id)
            ).all()
            for v in valves:
                await ha_client.turn_off(v.entity_id)
    _active.pop(zone_id, None)
    if len(_active) == 0:
        main_valve = _get_main_valve_entity()
        if main_valve:
            await ha_client.turn_off(main_valve)
            logger.info(f"Main valve {main_valve} closed")
    _update_log(info.get("log_id"), info.get("started_at"))
    await _broadcast("zone_stopped", {"zone_id": zone_id, "reason": "manual", "active_zones": get_active_zones()})


def _update_log(log_id: int, started_at: Optional[datetime], skipped: bool = False,
                skip_reason: Optional[SkipReason] = None):
    if not log_id:
        return
    ended = datetime.now(timezone.utc)
    duration = int((ended - started_at).total_seconds()) if started_at else None
    with Session(engine) as session:
        log = session.get(WateringLog, log_id)
        if log:
            log.ended_at = ended
            log.duration_sec = duration
            log.skipped = skipped
            log.skip_reason = skip_reason
            session.add(log)
            session.commit()


def _log_skip(zone_id: int, zone_name: str, valve_ids: List[int],
              skip_reason: SkipReason, triggered_by: TriggerSource):
    with Session(engine) as session:
        log = WateringLog(
            zone_id=zone_id,
            zone_name=zone_name,
            valve_ids=",".join(str(v) for v in valve_ids),
            started_at=datetime.now(timezone.utc),
            ended_at=datetime.now(timezone.utc),
            duration_sec=0,
            triggered_by=triggered_by,
            skipped=True,
            skip_reason=skip_reason,
        )
        session.add(log)
        session.commit()

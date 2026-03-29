from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database.db import get_session
from backend.models import Sensor, SensorCreate, SensorUpdate, SensorRead, SensorType
from backend.services import ha_client

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


def _enrich(sensor: Sensor) -> SensorRead:
    sr = SensorRead.model_validate(sensor)
    state = ha_client.get_cached_state(sensor.entity_id)
    sr.ha_state = state.get("state") if state else "unavailable"

    if state and sensor.enabled:
        val = state.get("state", "")
        if sensor.sensor_type == SensorType.rain:
            sr.is_blocking = val == "on"
        elif sensor.sensor_type == SensorType.temperature:
            try:
                sr.is_blocking = float(val) < (sensor.threshold or 2.0)
            except (ValueError, TypeError):
                pass
        elif sensor.sensor_type == SensorType.soil:
            try:
                sr.is_blocking = float(val) > (sensor.threshold or 80.0)
            except (ValueError, TypeError):
                pass
    return sr


@router.get("", response_model=List[SensorRead])
def list_sensors(session: Session = Depends(get_session)):
    sensors = session.exec(select(Sensor)).all()
    return [_enrich(s) for s in sensors]


@router.post("", response_model=SensorRead, status_code=201)
def create_sensor(sensor_in: SensorCreate, session: Session = Depends(get_session)):
    sensor = Sensor.model_validate(sensor_in)
    session.add(sensor)
    session.commit()
    session.refresh(sensor)
    return _enrich(sensor)


@router.get("/{sensor_id}", response_model=SensorRead)
def get_sensor(sensor_id: int, session: Session = Depends(get_session)):
    sensor = session.get(Sensor, sensor_id)
    if not sensor:
        raise HTTPException(404, "Sensor not found")
    return _enrich(sensor)


@router.patch("/{sensor_id}", response_model=SensorRead)
def update_sensor(sensor_id: int, sensor_in: SensorUpdate, session: Session = Depends(get_session)):
    sensor = session.get(Sensor, sensor_id)
    if not sensor:
        raise HTTPException(404, "Sensor not found")
    for key, val in sensor_in.model_dump(exclude_unset=True).items():
        setattr(sensor, key, val)
    session.add(sensor)
    session.commit()
    session.refresh(sensor)
    return _enrich(sensor)


@router.delete("/{sensor_id}", status_code=204)
def delete_sensor(sensor_id: int, session: Session = Depends(get_session)):
    sensor = session.get(Sensor, sensor_id)
    if not sensor:
        raise HTTPException(404, "Sensor not found")
    session.delete(sensor)
    session.commit()

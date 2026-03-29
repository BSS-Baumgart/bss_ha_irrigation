from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database.db import get_session
from backend.models import Zone, ZoneCreate, ZoneUpdate, ZoneRead, Valve
from backend.services import irrigation

router = APIRouter(prefix="/api/zones", tags=["zones"])


@router.get("", response_model=List[ZoneRead])
def list_zones(session: Session = Depends(get_session)):
    zones = session.exec(select(Zone)).all()
    result = []
    for z in zones:
        valve_count = len(session.exec(select(Valve).where(Valve.zone_id == z.id)).all())
        zr = ZoneRead.model_validate(z)
        zr.valve_count = valve_count
        zr.is_watering = irrigation.is_watering(z.id)
        result.append(zr)
    return result


@router.post("", response_model=ZoneRead, status_code=201)
def create_zone(zone_in: ZoneCreate, session: Session = Depends(get_session)):
    zone = Zone.model_validate(zone_in)
    session.add(zone)
    session.commit()
    session.refresh(zone)
    zr = ZoneRead.model_validate(zone)
    zr.valve_count = 0
    return zr


@router.get("/{zone_id}", response_model=ZoneRead)
def get_zone(zone_id: int, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    valve_count = len(session.exec(select(Valve).where(Valve.zone_id == zone_id)).all())
    zr = ZoneRead.model_validate(zone)
    zr.valve_count = valve_count
    zr.is_watering = irrigation.is_watering(zone_id)
    return zr


@router.patch("/{zone_id}", response_model=ZoneRead)
def update_zone(zone_id: int, zone_in: ZoneUpdate, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    for key, val in zone_in.model_dump(exclude_unset=True).items():
        setattr(zone, key, val)
    session.add(zone)
    session.commit()
    session.refresh(zone)
    valve_count = len(session.exec(select(Valve).where(Valve.zone_id == zone_id)).all())
    zr = ZoneRead.model_validate(zone)
    zr.valve_count = valve_count
    zr.is_watering = irrigation.is_watering(zone_id)
    return zr


@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: int, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    if irrigation.is_watering(zone_id):
        raise HTTPException(409, "Zone is currently watering — stop it first")
    session.delete(zone)
    session.commit()

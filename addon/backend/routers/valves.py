from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database.db import get_session
from backend.models import Valve, ValveCreate, ValveUpdate, ValveRead, Zone
from backend.services import ha_client

router = APIRouter(prefix="/api/valves", tags=["valves"])


def _enrich(valve: Valve, session: Session) -> ValveRead:
    vr = ValveRead.model_validate(valve)
    state = ha_client.get_cached_state(valve.entity_id)
    vr.ha_state = state.get("state") if state else "unavailable"
    if valve.zone_id:
        zone = session.get(Zone, valve.zone_id)
        vr.zone_name = zone.name if zone else None
    return vr


@router.get("", response_model=List[ValveRead])
def list_valves(session: Session = Depends(get_session)):
    valves = session.exec(select(Valve)).all()
    return [_enrich(v, session) for v in valves]


@router.post("", response_model=ValveRead, status_code=201)
def create_valve(valve_in: ValveCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Valve).where(Valve.entity_id == valve_in.entity_id)).first()
    if existing:
        raise HTTPException(409, f"Entity {valve_in.entity_id} already registered as valve")
    if valve_in.zone_id:
        _check_zone_exists(valve_in.zone_id, session)
    valve = Valve.model_validate(valve_in)
    session.add(valve)
    session.commit()
    session.refresh(valve)
    return _enrich(valve, session)


@router.get("/{valve_id}", response_model=ValveRead)
def get_valve(valve_id: int, session: Session = Depends(get_session)):
    valve = session.get(Valve, valve_id)
    if not valve:
        raise HTTPException(404, "Valve not found")
    return _enrich(valve, session)


@router.patch("/{valve_id}", response_model=ValveRead)
def update_valve(valve_id: int, valve_in: ValveUpdate, session: Session = Depends(get_session)):
    valve = session.get(Valve, valve_id)
    if not valve:
        raise HTTPException(404, "Valve not found")
    data = valve_in.model_dump(exclude_unset=True)
    if "zone_id" in data and data["zone_id"] is not None:
        _check_zone_exists(data["zone_id"], session)
    for key, val in data.items():
        setattr(valve, key, val)
    session.add(valve)
    session.commit()
    session.refresh(valve)
    return _enrich(valve, session)


@router.delete("/{valve_id}", status_code=204)
def delete_valve(valve_id: int, session: Session = Depends(get_session)):
    valve = session.get(Valve, valve_id)
    if not valve:
        raise HTTPException(404, "Valve not found")
    session.delete(valve)
    session.commit()


def _check_zone_exists(zone_id: int, session: Session):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, f"Zone {zone_id} not found")

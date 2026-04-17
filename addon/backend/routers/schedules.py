from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database.db import get_session
from backend.models import Schedule, ScheduleCreate, ScheduleUpdate, ScheduleRead, Zone, schedule_zone_ids
from backend.services import scheduler as sched_service

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


def _enrich(schedule: Schedule, session: Session) -> ScheduleRead:
    sr = ScheduleRead.model_validate(schedule)
    zone = session.get(Zone, schedule.zone_id)
    sr.zone_name = zone.name if zone else None
    sr.all_zone_ids = schedule_zone_ids(schedule)
    sr.next_run = sched_service.get_next_run(schedule.id)
    return sr


@router.get("", response_model=List[ScheduleRead])
def list_schedules(session: Session = Depends(get_session)):
    schedules = session.exec(select(Schedule)).all()
    return [_enrich(s, session) for s in schedules]


@router.post("", response_model=ScheduleRead, status_code=201)
def create_schedule(schedule_in: ScheduleCreate, session: Session = Depends(get_session)):
    zone = session.get(Zone, schedule_in.zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    schedule = Schedule.model_validate(schedule_in)
    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    sched_service.reload_schedules()
    return _enrich(schedule, session)


@router.get("/{schedule_id}", response_model=ScheduleRead)
def get_schedule(schedule_id: int, session: Session = Depends(get_session)):
    schedule = session.get(Schedule, schedule_id)
    if not schedule:
        raise HTTPException(404, "Schedule not found")
    return _enrich(schedule, session)


@router.patch("/{schedule_id}", response_model=ScheduleRead)
def update_schedule(schedule_id: int, schedule_in: ScheduleUpdate,
                    session: Session = Depends(get_session)):
    schedule = session.get(Schedule, schedule_id)
    if not schedule:
        raise HTTPException(404, "Schedule not found")
    for key, val in schedule_in.model_dump(exclude_unset=True).items():
        setattr(schedule, key, val)
    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    sched_service.reload_schedules()
    return _enrich(schedule, session)


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, session: Session = Depends(get_session)):
    schedule = session.get(Schedule, schedule_id)
    if not schedule:
        raise HTTPException(404, "Schedule not found")
    session.delete(schedule)
    session.commit()
    sched_service.reload_schedules()

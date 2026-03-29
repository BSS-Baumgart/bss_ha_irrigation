from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, desc

from backend.database.db import get_session
from backend.models import WateringLog, WateringLogRead

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=List[WateringLogRead])
def get_history(
    zone_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
):
    query = select(WateringLog).order_by(desc(WateringLog.started_at)).offset(offset).limit(limit)
    if zone_id is not None:
        query = query.where(WateringLog.zone_id == zone_id)
    logs = session.exec(query).all()
    return logs


@router.delete("", status_code=204)
def clear_history(zone_id: Optional[int] = Query(None),
                  session: Session = Depends(get_session)):
    query = select(WateringLog)
    if zone_id is not None:
        query = query.where(WateringLog.zone_id == zone_id)
    logs = session.exec(query).all()
    for log in logs:
        session.delete(log)
    session.commit()

from typing import Dict, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from backend.database.db import get_session
from backend.models import AppSetting, SettingWrite

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=Dict[str, Optional[str]])
def get_all(session: Session = Depends(get_session)):
    rows = session.exec(select(AppSetting)).all()
    return {r.key: r.value for r in rows}


@router.get("/{key}")
def get_one(key: str, session: Session = Depends(get_session)):
    row = session.get(AppSetting, key)
    return {"key": key, "value": row.value if row else None}


@router.put("/{key}")
def set_one(key: str, body: SettingWrite, session: Session = Depends(get_session)):
    row = session.get(AppSetting, key)
    if row:
        row.value = body.value
    else:
        row = AppSetting(key=key, value=body.value)
    session.add(row)
    session.commit()
    return {"key": key, "value": row.value}

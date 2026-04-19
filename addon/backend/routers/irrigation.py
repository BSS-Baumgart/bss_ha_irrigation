from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import irrigation as irr
from backend.models import TriggerSource

router = APIRouter(prefix="/api/irrigation", tags=["irrigation"])


class StartRequest(BaseModel):
    duration_min: Optional[int] = None


@router.get("/status")
def get_status():
    return {
        "active_zones": irr.get_active_zones(),
        "any_watering": len(irr.get_active_zones()) > 0,
        "runtime_status": irr.get_runtime_status(),
    }


@router.post("/start/{zone_id}")
async def start_zone(zone_id: int, body: StartRequest = StartRequest()):
    result = await irr.start_zone(
        zone_id=zone_id,
        duration_min=body.duration_min,
        triggered_by=TriggerSource.manual,
    )
    if not result.get("ok") and not result.get("skipped"):
        raise HTTPException(400, result.get("error", "Cannot start zone"))
    return result


@router.post("/stop/{zone_id}")
async def stop_zone(zone_id: int):
    result = await irr.stop_zone(zone_id)
    if not result.get("ok"):
        raise HTTPException(400, result.get("error", "Zone not watering"))
    return result


@router.post("/stop-all")
async def stop_all():
    return await irr.stop_all()

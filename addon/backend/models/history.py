from typing import Optional
from enum import Enum
from datetime import datetime
from sqlmodel import SQLModel, Field
from pydantic import field_serializer


class SkipReason(str, Enum):
    rain = "rain"
    soil_wet = "soil_wet"
    frost = "frost"
    manual_stop = "manual_stop"
    ha_unavailable = "ha_unavailable"


class TriggerSource(str, Enum):
    schedule = "schedule"
    manual = "manual"


class WateringLog(SQLModel, table=True):
    __tablename__ = "watering_log"
    id: Optional[int] = Field(default=None, primary_key=True)
    zone_id: Optional[int] = Field(default=None, foreign_key="zones.id")
    zone_name: str = Field(max_length=100)
    valve_ids: str = Field(default="")      # comma-separated valve ids
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_sec: Optional[int] = None
    triggered_by: TriggerSource = Field(default=TriggerSource.schedule)
    skipped: bool = Field(default=False)
    skip_reason: Optional[SkipReason] = None
    water_liters: Optional[float] = None    # from flow sensor if available


def _to_utc_str(v: Optional[datetime]) -> Optional[str]:
    """Serialize a naive-UTC or aware datetime to an ISO string with 'Z' suffix."""
    if v is None:
        return None
    if v.tzinfo is not None:
        return v.isoformat()
    return v.isoformat() + "Z"


class WateringLogRead(SQLModel):
    id: int
    zone_id: Optional[int]
    zone_name: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_sec: Optional[int]
    triggered_by: TriggerSource
    skipped: bool
    skip_reason: Optional[SkipReason]
    water_liters: Optional[float]

    @field_serializer("started_at")
    def _ser_started(self, v: datetime) -> str:
        return _to_utc_str(v) or ""

    @field_serializer("ended_at")
    def _ser_ended(self, v: Optional[datetime]) -> Optional[str]:
        return _to_utc_str(v)

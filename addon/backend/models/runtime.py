from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class ActiveWateringState(SQLModel, table=True):
    __tablename__ = "active_watering"

    zone_id: int = Field(primary_key=True)
    zone_name: str = Field(max_length=100)
    valve_entities: str = Field(default="")  # comma-separated HA entity_ids
    started_at: datetime = Field(default_factory=datetime.utcnow)
    planned_end_at: datetime
    duration_min: int = Field(ge=1, le=240)
    log_id: Optional[int] = None

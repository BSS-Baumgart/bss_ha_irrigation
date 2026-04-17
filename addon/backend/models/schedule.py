from typing import List, Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class WateringMode(str, Enum):
    sequential = "sequential"
    parallel = "parallel"


class ScheduleBase(SQLModel):
    zone_id: int = Field(foreign_key="zones.id")
    # Optional comma-separated list of additional zone IDs for sequential multi-zone runs.
    # When set, zone_id is the first zone and extra_zone_ids holds the rest.
    extra_zone_ids: Optional[str] = Field(default=None, max_length=256)
    weekdays: int = Field(default=0b1111111, ge=0, le=127)
    start_time: str = Field(max_length=5)     # "HH:MM"
    duration_override_min: Optional[int] = Field(default=None, ge=1, le=240)
    mode: WateringMode = Field(default=WateringMode.sequential)
    enabled: bool = Field(default=True)
    skip_if_rain: bool = Field(default=True)
    skip_if_soil_wet: bool = Field(default=True)
    skip_if_frost: bool = Field(default=True)


class Schedule(ScheduleBase, table=True):
    __tablename__ = "schedules"
    id: Optional[int] = Field(default=None, primary_key=True)


def schedule_zone_ids(schedule: "Schedule") -> List[int]:
    """Return all zone IDs for this schedule (primary + extras), in order."""
    ids = [schedule.zone_id]
    if schedule.extra_zone_ids:
        for part in schedule.extra_zone_ids.split(","):
            part = part.strip()
            if part.isdigit():
                ids.append(int(part))
    return ids


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(SQLModel):
    zone_id: Optional[int] = None
    extra_zone_ids: Optional[str] = Field(default=None, max_length=256)
    weekdays: Optional[int] = Field(default=None, ge=0, le=127)
    start_time: Optional[str] = Field(default=None, max_length=5)
    duration_override_min: Optional[int] = Field(default=None, ge=1, le=240)
    mode: Optional[WateringMode] = None
    enabled: Optional[bool] = None
    skip_if_rain: Optional[bool] = None
    skip_if_soil_wet: Optional[bool] = None
    skip_if_frost: Optional[bool] = None


class ScheduleRead(ScheduleBase):
    id: int
    zone_name: Optional[str] = None
    all_zone_ids: Optional[List[int]] = None   # resolved list: [zone_id] + extras
    next_run: Optional[str] = None   # ISO datetime string

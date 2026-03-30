from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class WateringMode(str, Enum):
    sequential = "sequential"
    parallel = "parallel"


class ScheduleBase(SQLModel):
    zone_id: int = Field(foreign_key="zones.id")
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


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(SQLModel):
    zone_id: Optional[int] = None
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
    next_run: Optional[str] = None   # ISO datetime string

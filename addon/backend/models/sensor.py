from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class SensorType(str, Enum):
    rain = "rain"
    soil = "soil"
    flow = "flow"
    temperature = "temperature"
    weather = "weather"


class SensorBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    entity_id: str = Field(min_length=1, max_length=200)
    sensor_type: SensorType
    threshold: Optional[float] = None   # soil: %, temp: °C
    enabled: bool = Field(default=True)
    notes: Optional[str] = Field(default=None, max_length=500)


class Sensor(SensorBase, table=True):
    __tablename__ = "sensors"
    id: Optional[int] = Field(default=None, primary_key=True)


class SensorCreate(SensorBase):
    pass


class SensorUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    entity_id: Optional[str] = Field(default=None, min_length=1, max_length=200)
    sensor_type: Optional[SensorType] = None
    threshold: Optional[float] = None
    enabled: Optional[bool] = None
    notes: Optional[str] = None


class SensorRead(SensorBase):
    id: int
    ha_state: Optional[str] = None
    is_blocking: bool = False   # True = currently blocks watering
